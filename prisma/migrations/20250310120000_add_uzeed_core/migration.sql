-- Create enums
DO $$ BEGIN
  CREATE TYPE "CategoryType" AS ENUM ('PROFESSIONAL', 'ESTABLISHMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PlanTier" AS ENUM ('PREMIUM', 'GOLD', 'SILVER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ServiceStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'PENDING_EVALUATION', 'FINISHED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPPORT';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User extensions
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "categoryId" UUID,
  ADD COLUMN IF NOT EXISTS "planId" UUID,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "anonymousMode" BOOLEAN NOT NULL DEFAULT false;

-- Category
CREATE TABLE IF NOT EXISTS "Category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" "CategoryType" NOT NULL,
  "iconUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Plan
CREATE TABLE IF NOT EXISTS "Plan" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "tier" "PlanTier" NOT NULL,
  "price" INTEGER NOT NULL,
  "badgeColor" TEXT,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- Establishment
CREATE TABLE IF NOT EXISTS "Establishment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ownerId" UUID,
  "name" TEXT NOT NULL,
  "city" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "description" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "categoryId" UUID,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EstablishmentMedia" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "establishmentId" UUID NOT NULL,
  "type" "MediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EstablishmentMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FavoriteProfessional" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "professionalId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoriteProfessional_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FavoriteProfessional_userId_professionalId_key" ON "FavoriteProfessional"("userId", "professionalId");

CREATE TABLE IF NOT EXISTS "ServiceRequest" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL,
  "professionalId" UUID NOT NULL,
  "status" "ServiceStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RatingProfessional" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "professionalId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RatingProfessional_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RatingProfessional_professionalId_clientId_key" ON "RatingProfessional"("professionalId", "clientId");

CREATE TABLE IF NOT EXISTS "RatingEstablishment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "establishmentId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RatingEstablishment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RatingEstablishment_establishmentId_clientId_key" ON "RatingEstablishment"("establishmentId", "clientId");

CREATE TABLE IF NOT EXISTS "Banner" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "linkUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FeaturedProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL,
  "rank" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeaturedProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Country" (
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

CREATE TABLE IF NOT EXISTS "Region" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "countryCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProfileView" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "viewerId" UUID NOT NULL,
  "profileId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProfileView_viewerId_createdAt_idx" ON "ProfileView"("viewerId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProfileView_profileId_createdAt_idx" ON "ProfileView"("profileId", "createdAt");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "adminId" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EstablishmentMedia" ADD CONSTRAINT "EstablishmentMedia_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FavoriteProfessional" ADD CONSTRAINT "FavoriteProfessional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteProfessional" ADD CONSTRAINT "FavoriteProfessional_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RatingProfessional" ADD CONSTRAINT "RatingProfessional_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RatingProfessional" ADD CONSTRAINT "RatingProfessional_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RatingEstablishment" ADD CONSTRAINT "RatingEstablishment_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RatingEstablishment" ADD CONSTRAINT "RatingEstablishment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeaturedProfile" ADD CONSTRAINT "FeaturedProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Region" ADD CONSTRAINT "Region_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
