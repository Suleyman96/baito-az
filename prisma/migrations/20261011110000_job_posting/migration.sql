-- CreateEnum
CREATE TYPE "PayPeriod" AS ENUM ('MONTH', 'HOUR', 'JOB');

-- AlterEnum
ALTER TYPE "EmploymentType" ADD VALUE 'ONE_DAY';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "durationHours" INTEGER,
ADD COLUMN     "payPeriod" "PayPeriod" NOT NULL DEFAULT 'MONTH',
ADD COLUMN     "workStart" TIMESTAMP(3),
ADD COLUMN     "workersNeeded" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

