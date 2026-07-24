import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, isAddress, parseEventLogs } from 'viem';
import { profileMustMatch } from '@/app/lib/githubAuth';
import { MONAD_CHAIN, weeklyContractAddress } from '@/app/lib/monad';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

const WEEKLY_ABI = [{
  type: 'event',
  name: 'BuildRecordMinted',
  inputs: [
    { indexed: true, name: 'owner', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
    { indexed: false, name: 'username', type: 'string' },
    { indexed: false, name: 'weekKey', type: 'string' },
    { indexed: false, name: 'traitsHash', type: 'bytes32' },
  ],
  anonymous: false,
}] as const;

const client = createPublicClient({ chain: MONAD_CHAIN, transport: http(MONAD_CHAIN.rpcUrls.default.http[0]) });

export async function POST(request: NextRequest) {
  try {
    const { username, weekKey, txHash, ownerAddress } = await request.json();
    if (!username || !weekKey || !txHash || !ownerAddress || !isAddress(ownerAddress)) {
      return NextResponse.json({ error: 'A weekly record, transaction, and wallet address are required.' }, { status: 400 });
    }
    const verified = profileMustMatch(request, username);
    if (verified.error) return NextResponse.json({ error: verified.error }, { status: 401 });

    const contract = weeklyContractAddress();
    if (!contract) return NextResponse.json({ error: 'The weekly Admon collection is not configured yet.' }, { status: 503 });
    const receipt = await client.getTransactionReceipt({ hash: txHash });
    if (receipt.status !== 'success' || receipt.to?.toLowerCase() !== contract.toLowerCase()) {
      return NextResponse.json({ error: 'This is not a successful Admon Trace mint transaction.' }, { status: 400 });
    }

    const event = parseEventLogs({ abi: WEEKLY_ABI, eventName: 'BuildRecordMinted', logs: receipt.logs })
      .find((log) => log.args.username?.toLowerCase() === username.toLowerCase() && log.args.weekKey === weekKey);
    if (!event?.args.tokenId || event.args.owner?.toLowerCase() !== ownerAddress.toLowerCase()) {
      return NextResponse.json({ error: 'This transaction minted a different weekly build record.' }, { status: 400 });
    }

    const builder = await prisma.builder.findFirst({ where: { githubUsername: { equals: username, mode: 'insensitive' } } });
    if (!builder) return NextResponse.json({ error: 'Builder profile not found.' }, { status: 404 });
    const record = await prisma.buildRecord.findUnique({ where: { builderId_weekKey: { builderId: builder.id, weekKey } } });
    if (!record) return NextResponse.json({ error: 'Weekly build record not found.' }, { status: 404 });

    await prisma.buildRecord.update({
      where: { id: record.id },
      data: { mintedAt: new Date(), tokenId: Number(event.args.tokenId), mintTxHash: txHash, ownerAddress, contractAddress: contract },
    });
    return NextResponse.json({ tokenId: Number(event.args.tokenId) });
  } catch (error) {
    console.error('[weekly-finalize-mint]', error);
    return NextResponse.json({ error: 'Could not verify and record this weekly Monad transaction.' }, { status: 500 });
  }
}
