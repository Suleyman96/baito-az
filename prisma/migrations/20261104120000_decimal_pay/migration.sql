-- Pay amounts can have decimals (3.50 AZN an hour). Whole numbers already stored keep their value exactly.
-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "salaryMin" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "salaryMax" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WorkerProfile" ALTER COLUMN "expectedPay" SET DATA TYPE DOUBLE PRECISION;

