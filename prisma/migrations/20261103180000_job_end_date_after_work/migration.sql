-- A one-day job's end date may not be before its work date (the listing would close before the work).
-- Saved jobs that break this get the work date itself as their end date, the closest valid choice,
-- and their end time to match; nothing else changes.
UPDATE "Job"
SET "endDate" = ("workStart" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baku')::date,
    "expiresAt" = (date_trunc('day', "workStart" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baku') + INTERVAL '1 day') AT TIME ZONE 'Asia/Baku' AT TIME ZONE 'UTC'
WHERE "endDate" IS NOT NULL AND "workStart" IS NOT NULL
  AND "endDate" < ("workStart" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baku')::date;

-- Checked by the database too (Baku date of the work)
ALTER TABLE "Job" ADD CONSTRAINT "Job_end_date_after_work" CHECK (
  "endDate" IS NULL OR "workStart" IS NULL OR "endDate" >= ("workStart" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Baku')::date
);
