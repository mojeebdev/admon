-- Admon schema update: Genesis fields + Builder / BuildRecord / ConnectionRequest
-- Matches prisma/schema.prisma (2026-07-24)

CREATE TABLE IF NOT EXISTS "Builder" (
  "id"              TEXT NOT NULL,
  "githubUsername"  TEXT NOT NULL,
  "githubId"        INTEGER,
  "avatarUrl"       TEXT,
  "name"            TEXT,
  "bio"             TEXT,
  "genesisNumber"   INTEGER,
  "genesisAt"       TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Builder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Builder_githubUsername_key"
  ON "Builder"("githubUsername");

CREATE UNIQUE INDEX IF NOT EXISTS "Builder_githubId_key"
  ON "Builder"("githubId");

CREATE UNIQUE INDEX IF NOT EXISTS "Builder_genesisNumber_key"
  ON "Builder"("genesisNumber");

CREATE INDEX IF NOT EXISTS "Builder_genesisNumber_idx"
  ON "Builder"("genesisNumber");

ALTER TABLE "Car"
  ADD COLUMN IF NOT EXISTS "isGenesis"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "genesisNumber" INTEGER,
  ADD COLUMN IF NOT EXISTS "genesisAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "builderId"     TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Car_genesisNumber_key"
  ON "Car"("genesisNumber");

CREATE INDEX IF NOT EXISTS "Car_builderId_idx"
  ON "Car"("builderId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Car_builderId_fkey'
  ) THEN
    ALTER TABLE "Car"
      ADD CONSTRAINT "Car_builderId_fkey"
      FOREIGN KEY ("builderId") REFERENCES "Builder"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "BuildRecord" (
  "id"              TEXT NOT NULL,
  "builderId"       TEXT NOT NULL,
  "weekKey"         TEXT NOT NULL,
  "traits"          JSONB NOT NULL,
  "statsSnapshot"   JSONB NOT NULL,
  "totalCommits"    INTEGER NOT NULL DEFAULT 0,
  "rarityScore"     INTEGER NOT NULL,
  "rarityTier"      TEXT NOT NULL,
  "contractVersion" TEXT NOT NULL DEFAULT 'v2',
  "contractAddress" TEXT,
  "mintedAt"        TIMESTAMP(3),
  "tokenId"         INTEGER,
  "mintTxHash"      TEXT,
  "ownerAddress"    TEXT,
  "imageUrl"        TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BuildRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BuildRecord_builderId_weekKey_key"
  ON "BuildRecord"("builderId", "weekKey");

CREATE UNIQUE INDEX IF NOT EXISTS "BuildRecord_contractAddress_tokenId_key"
  ON "BuildRecord"("contractAddress", "tokenId");

CREATE INDEX IF NOT EXISTS "BuildRecord_builderId_createdAt_idx"
  ON "BuildRecord"("builderId", "createdAt");

CREATE INDEX IF NOT EXISTS "BuildRecord_mintedAt_idx"
  ON "BuildRecord"("mintedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BuildRecord_builderId_fkey'
  ) THEN
    ALTER TABLE "BuildRecord"
      ADD CONSTRAINT "BuildRecord_builderId_fkey"
      FOREIGN KEY ("builderId") REFERENCES "Builder"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ConnectionRequest" (
  "id"          TEXT NOT NULL,
  "senderId"    TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "respondedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConnectionRequest_senderId_recipientId_key"
  ON "ConnectionRequest"("senderId", "recipientId");

CREATE INDEX IF NOT EXISTS "ConnectionRequest_recipientId_status_createdAt_idx"
  ON "ConnectionRequest"("recipientId", "status", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConnectionRequest_senderId_fkey'
  ) THEN
    ALTER TABLE "ConnectionRequest"
      ADD CONSTRAINT "ConnectionRequest_senderId_fkey"
      FOREIGN KEY ("senderId") REFERENCES "Builder"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConnectionRequest_recipientId_fkey'
  ) THEN
    ALTER TABLE "ConnectionRequest"
      ADD CONSTRAINT "ConnectionRequest_recipientId_fkey"
      FOREIGN KEY ("recipientId") REFERENCES "Builder"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
