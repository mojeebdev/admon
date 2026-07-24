import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const CUTOFF = new Date('2026-07-24T14:23:00.000Z');
const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

async function main() {
  if (Date.now() < CUTOFF.getTime()) {
    throw new Error(`Genesis snapshot is locked until ${CUTOFF.toISOString()}.`);
  }

  const eligible = await prisma.car.findMany({
    where: { createdAt: { lte: CUTOFF } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  console.log(`Genesis cutoff: ${CUTOFF.toISOString()}`);
  console.log(`Eligible verified V1 records: ${eligible.length}`);
  console.table(eligible.map((car, index) => ({
    genesisNumber: index + 1,
    username: car.githubUsername,
    createdAt: car.createdAt.toISOString(),
    minted: Boolean(car.mintedAt),
  })));

  if (!APPLY) {
    console.log('Dry run only. Run "node scripts/snapshot-genesis.mjs --apply" to write the snapshot.');
    return;
  }

  // Sequential writes (not one long interactive transaction): Supabase pooler
  // drops interactive txns that run longer than a few seconds. Re-running is safe.
  for (const [index, car] of eligible.entries()) {
    const genesisNumber = index + 1;
    const builder = await resolveBuilder(prisma, car, genesisNumber);

    await prisma.car.update({
      where: { id: car.id },
      data: {
        isGenesis: true,
        genesisNumber,
        genesisAt: CUTOFF,
        builderId: builder.id,
      },
    });

    console.log(`  #${genesisNumber} @${car.githubUsername}`);
  }

  console.log(`Genesis snapshot applied to ${eligible.length} V1 records.`);
}

/**
 * Upsert Builder without tripping unique(githubId) when the same GitHub id
 * already exists under a different username, or githubId is null.
 */
async function resolveBuilder(tx, car, genesisNumber) {
  let builder = await tx.builder.findUnique({
    where: { githubUsername: car.githubUsername },
  });

  if (!builder && car.githubId != null) {
    builder = await tx.builder.findUnique({
      where: { githubId: car.githubId },
    });
  }

  const profile = {
    githubUsername: car.githubUsername,
    avatarUrl: car.avatarUrl,
    name: car.name,
    bio: car.bio,
    genesisNumber,
    genesisAt: CUTOFF,
  };

  if (builder) {
    return tx.builder.update({
      where: { id: builder.id },
      data: {
        ...profile,
        // Only write githubId when present so we never collide with null/unique races.
        ...(car.githubId != null ? { githubId: car.githubId } : {}),
      },
    });
  }

  return tx.builder.create({
    data: {
      ...profile,
      ...(car.githubId != null ? { githubId: car.githubId } : {}),
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
