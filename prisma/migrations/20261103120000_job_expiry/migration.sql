-- Listing periods and automatic archiving of jobs. Adds columns, a status and a table; no data is removed.
-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "endDate" DATE,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "JobArchiveNotice" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL,
    "emailStatus" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "emailError" TEXT,
    "emailedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobArchiveNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobArchiveNotice_emailStatus_idx" ON "JobArchiveNotice"("emailStatus");

-- CreateIndex
CREATE UNIQUE INDEX "JobArchiveNotice_jobId_archivedAt_key" ON "JobArchiveNotice"("jobId", "archivedAt");

-- CreateIndex
CREATE INDEX "Job_status_expiresAt_idx" ON "Job"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "JobArchiveNotice" ADD CONSTRAINT "JobArchiveNotice_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: every existing job keeps its data and gets a listing period by the new rules (Baku calendar).
-- Times are stored as UTC; "x AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baku'" gives the Baku wall-clock time,
-- and "y AT TIME ZONE 'Asia/Baku' AT TIME ZONE 'UTC'" turns a Baku wall-clock time back into UTC.

-- Full-time / part-time jobs on the site: one month from when they were posted. (The approval time was not
-- recorded, so the posting time is used.) Ones already older than a month are archived by the next run.
UPDATE "Job"
SET "publishedAt" = "createdAt",
    "expiresAt" = (("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baku') + INTERVAL '1 month') AT TIME ZONE 'Asia/Baku' AT TIME ZONE 'UTC'
WHERE "employmentType" <> 'ONE_DAY' AND "status" = 'ACTIVE';

-- One-day jobs: until the end of the third day after the work date
UPDATE "Job"
SET "expiresAt" = (date_trunc('day', "workStart" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baku') + INTERVAL '4 days') AT TIME ZONE 'Asia/Baku' AT TIME ZONE 'UTC'
WHERE "employmentType" = 'ONE_DAY' AND "workStart" IS NOT NULL;

UPDATE "Job" SET "publishedAt" = "createdAt" WHERE "employmentType" = 'ONE_DAY' AND "status" = 'ACTIVE';

-- Checked by the database too, whatever the code does:
-- a job on the site always has an end;
ALTER TABLE "Job" ADD CONSTRAINT "Job_active_has_expiry" CHECK ("status" <> 'ACTIVE' OR "expiresAt" IS NOT NULL);
-- only one-day jobs have an end date picked by the employer;
ALTER TABLE "Job" ADD CONSTRAINT "Job_end_date_one_day" CHECK ("endDate" IS NULL OR "employmentType" = 'ONE_DAY');
-- a one-day listing ends at most a month after the work (the form allows 30 days after the work date);
ALTER TABLE "Job" ADD CONSTRAINT "Job_one_day_expiry_limit" CHECK (
  "employmentType" <> 'ONE_DAY' OR "expiresAt" IS NULL OR "workStart" IS NULL OR "expiresAt" <= "workStart" + INTERVAL '32 days'
);
-- a full-time / part-time listing lasts one month from its start and cannot be extended by hand.
-- 32 days allows for the month lengths; the exact month is set by the code (src/lib/job-expiry.ts)
ALTER TABLE "Job" ADD CONSTRAINT "Job_listing_month_limit" CHECK (
  "employmentType" = 'ONE_DAY' OR "expiresAt" IS NULL OR ("publishedAt" IS NOT NULL AND "expiresAt" <= "publishedAt" + INTERVAL '32 days')
);
