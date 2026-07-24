import { prisma } from '@/app/lib/prisma';

export async function findBuilderByUsername(username: string) {
  return prisma.builder.findFirst({
    where: { githubUsername: { equals: username, mode: 'insensitive' } },
  });
}

/**
 * Creates a Builder identity only for an existing verified V1 record.
 * Anonymous previews never call this helper, so they cannot create profiles.
 */
export async function ensureBuilderForUsername(username: string) {
  const existing = await findBuilderByUsername(username);
  if (existing) return existing;

  const car = await prisma.car.findFirst({
    where: { githubUsername: { equals: username, mode: 'insensitive' } },
  });
  if (!car) return null;

  return prisma.builder.upsert({
    where: { githubUsername: car.githubUsername },
    create: {
      githubUsername: car.githubUsername,
      githubId: car.githubId,
      avatarUrl: car.avatarUrl,
      name: car.name,
      bio: car.bio,
      genesisNumber: car.genesisNumber,
      genesisAt: car.genesisAt,
      legacyCars: { connect: { id: car.id } },
    },
    update: {
      githubId: car.githubId,
      avatarUrl: car.avatarUrl,
      name: car.name,
      bio: car.bio,
      genesisNumber: car.genesisNumber,
      genesisAt: car.genesisAt,
      legacyCars: { connect: { id: car.id } },
    },
  });
}

export function fridayWeekKey(date = new Date()) {
  if (date.getUTCDay() !== 5) return null;
  return date.toISOString().slice(0, 10);
}
