import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, getAddress, http, isAddress } from 'viem';
import { prisma } from '@/app/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKET } from '@/app/lib/supabase';
import { generateCarPng } from '@/app/lib/imageGen';
import { contractAddress, MONAD_CHAIN } from '@/app/lib/monad';
import { profileMustMatch } from '@/app/lib/githubAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const client = createPublicClient({
  chain: MONAD_CHAIN,
  transport: http(MONAD_CHAIN.rpcUrls.default.http[0]),
});
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ADMON_READ_ABI = [
  {
    type: 'function',
    name: 'usernameByTokenId',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const { username, txHash, ownerAddress } = await request.json();
    if (!username || !txHash || !ownerAddress || !isAddress(ownerAddress)) {
      return NextResponse.json({ error: 'Missing or invalid mint details.' }, { status: 400 });
    }
    const verified = profileMustMatch(request, username);
    if (verified.error) return NextResponse.json({ error: verified.error }, { status: 401 });

    const contract = contractAddress();
    if (!contract || !isAddress(contract)) {
      return NextResponse.json({ error: 'Admon contract is not configured.' }, { status: 503 });
    }
    const receipt = await client.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 });
    if (receipt.status !== 'success' || !receipt.to || getAddress(receipt.to) !== getAddress(contract)) {
      return NextResponse.json({ error: 'This is not a successful Admon mint transaction.' }, { status: 400 });
    }

    let tokenId: number | null = null;
    const expectedOwner = getAddress(ownerAddress);
    for (const log of receipt.logs) {
      if (
        getAddress(log.address) === getAddress(contract) &&
        log.topics[0] === TRANSFER_TOPIC &&
        log.topics[2] &&
        log.topics[3]
      ) {
        const mintedOwner = getAddress(`0x${log.topics[2].slice(-40)}`);
        if (mintedOwner !== expectedOwner) {
          return NextResponse.json({ error: 'This mint was sent to a different wallet.' }, { status: 400 });
        }
        tokenId = Number(BigInt(log.topics[3]));
        break;
      }
    }
    if (tokenId === null) {
      return NextResponse.json({ error: 'Mint transaction did not emit an ERC-721 transfer.' }, { status: 400 });
    }
    const mintedUsername = await client.readContract({
      address: getAddress(contract),
      abi: ADMON_READ_ABI,
      functionName: 'usernameByTokenId',
      args: [BigInt(tokenId)],
    });
    if (mintedUsername.toLowerCase() !== username.toLowerCase()) {
      return NextResponse.json({ error: 'This transaction minted a different GitHub build record.' }, { status: 400 });
    }

    const car = await prisma.car.findUnique({ where: { githubUsername: username } });
    if (!car) return NextResponse.json({ error: 'Verified build history was not found.' }, { status: 404 });
    if (car.mintedAt) return NextResponse.json({ ok: true, tokenId: car.tokenId, imageUrl: car.imageUrl });

    let imageUrl: string | null = null;
    try {
      const png = await generateCarPng(car);
      const path = `${username}-${tokenId}.png`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(path, png, { contentType: 'image/png', cacheControl: '31536000', upsert: true });
      if (uploadError) {
        console.error('[finalize-mint] image upload failed:', uploadError);
      } else {
        imageUrl = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      }
    } catch (error) {
      console.error('[finalize-mint] share card generation failed:', error);
    }

    const updated = await prisma.car.update({
      where: { githubUsername: username },
      data: {
        mintedAt: new Date(),
        mintTxHash: txHash,
        ownerAddress: getAddress(ownerAddress),
        tokenId,
        imageUrl,
      },
    });

    return NextResponse.json({ ok: true, tokenId: updated.tokenId, imageUrl });
  } catch (error) {
    console.error('[finalize-mint]', error);
    return NextResponse.json({ error: 'Could not verify and record this Monad transaction.' }, { status: 500 });
  }
}
