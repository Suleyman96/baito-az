-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "rejectReason" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockedAt" TIMESTAMP(3);

