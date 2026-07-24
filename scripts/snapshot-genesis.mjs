import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';

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

  await prisma.$transaction(async (tx) => {
    for (const [index, car] of eligible.entries()) {
      const genesisNumber = index + 1;
      const builder = await tx.builder.upsert({
        where: { githubUsername: car.githubUsername },
        create: {
          githubUsername: car.githubUsername,
          githubId: car.githubId,
          avatarUrl: car.avatarUrl,
          name: car.name,
          bio: car.bio,
          genesisNumber,
          genesisAt: CUTOFF,
        },
        update: {
          githubId: car.githubId,
          avatarUrl: car.avatarUrl,
          name: car.name,
          bio: car.bio,
          genesisNumber,
          genesisAt: CUTOFF,
        },
      });

      await tx.car.update({
        where: { id: car.id },
        data: {
          isGenesis: true,
          genesisNumber,
          genesisAt: CUTOFF,
          builderId: builder.id,
        },
      });
    }
  });

  console.log(`Genesis snapshot applied to ${eligible.length} V1 records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
