import { NextRequest, NextResponse } from 'next/server';
import { getAddress, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { profileMustMatch } from '@/app/lib/githubAuth';
import { appUrl, contractAddress, MONAD_CHAIN } from '@/app/lib/monad';
import { prisma } from '@/app/lib/prisma';
import { hashTraits, type CarTraits } from '@/app/lib/traits';

export const runtime = 'nodejs';

const mintTypes = {
  Mint: [
    { name: 'recipient', type: 'address' },
    { name: 'username', type: 'string' },
    { name: 'traitsHash', type: 'bytes32' },
    { name: 'tokenURI', type: 'string' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export async function POST(request: NextRequest) {
  try {
    const { username, ownerAddress } = await request.json();
    if (!username || !isAddress(ownerAddress)) {
      return NextResponse.json({ error: 'A GitHub profile and valid wallet address are required.' }, { status: 400 });
    }
    const verified = profileMustMatch(request, username);
    if (verified.error) return NextResponse.json({ error: verified.error }, { status: 401 });

    const contract = contractAddress();
    const privateKey = process.env.MONAD_AUTHORIZER_PRIVATE_KEY as `0x${string}` | undefined;
    if (!contract || !privateKey) {
      return NextResponse.json({ error: 'Mint authorization is not configured yet.' }, { status: 503 });
    }

    const car = await prisma.car.findUnique({ where: { githubUsername: username } });
    if (!car) return NextResponse.json({ error: 'Build history not found. Verify it before minting.' }, { status: 404 });
    if (car.mintedAt) return NextResponse.json({ error: 'This verified build history has already been minted.' }, { status: 409 });

    const traits = car.traits as unknown as CarTraits;
    const traitsHash = hashTraits(traits);
    const tokenURI = `${appUrl()}/api/metadata/${encodeURIComponent(username)}`;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 10 * 60);
    const account = privateKeyToAccount(privateKey);
    const signature = await account.signTypedData({
      domain: {
        name: 'Admon',
        version: '1',
        chainId: MONAD_CHAIN.id,
        verifyingContract: contract,
      },
      types: mintTypes,
      primaryType: 'Mint',
      message: {
        recipient: getAddress(ownerAddress),
        username,
        traitsHash,
        tokenURI,
        deadline,
      },
    });

    return NextResponse.json({
      traitsHash,
      tokenURI,
      deadline: deadline.toString(),
      signature,
    });
  } catch (error) {
    console.error('[mint-authorization]', error);
    return NextResponse.json({ error: 'Could not create a secure mint authorization.' }, { status: 500 });
  }
}
