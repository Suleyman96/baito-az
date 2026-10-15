-- CreateEnum
CREATE TYPE "Workplace" AS ENUM ('ONSITE', 'REMOTE', 'ANY');

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "portfolioOfId" TEXT;

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "ageRange" TEXT,
    "bio" TEXT,
    "primaryProfession" TEXT NOT NULL,
    "additionalProfessions" TEXT[],
    "skills" TEXT[],
    "experienceYears" INTEGER,
    "workHistory" TEXT,
    "certificates" TEXT,
    "district" TEXT NOT NULL,
    "locationId" INTEGER,
    "preferredDistricts" TEXT[],
    "maxCommuteKm" INTEGER,
    "willingToRelocate" BOOLEAN NOT NULL DEFAULT false,
    "workTypes" "EmploymentType"[],
    "availableFrom" TIMESTAMP(3),
    "availableWeekdays" BOOLEAN NOT NULL DEFAULT true,
    "availableWeekends" BOOLEAN NOT NULL DEFAULT false,
    "expectedPay" INTEGER,
    "expectedPayPeriod" "PayPeriod" NOT NULL DEFAULT 'MONTH',
    "workplace" "Workplace" NOT NULL DEFAULT 'ONSITE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE INDEX "WorkerProfile_visible_district_idx" ON "WorkerProfile"("visible", "district");

-- CreateIndex
CREATE INDEX "WorkerProfile_primaryProfession_idx" ON "WorkerProfile"("primaryProfession");

-- CreateIndex
CREATE INDEX "Image_portfolioOfId_position_idx" ON "Image"("portfolioOfId", "position");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_portfolioOfId_fkey" FOREIGN KEY ("portfolioOfId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

