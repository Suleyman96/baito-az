-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "nameKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- Backfill the key for existing real companies (a private person's company carries the owner's name).
-- Same rule as companyNameKey() in src/lib/company-name.ts. Names that already repeat are left without
-- a key, so nothing is changed or deleted automatically; find them with:
--   SELECT name FROM "Company" WHERE "nameKey" IS NULL ORDER BY lower(name);
WITH keyed AS (
  SELECT c."id",
         replace(lower(translate(regexp_replace(btrim(c."name"), '\s+', ' ', 'g'), 'İIı', 'iii')), U&'\0307', '') AS "key"
  FROM "Company" c
  JOIN "User" u ON u."id" = c."ownerId"
  WHERE c."name" <> u."name"
)
UPDATE "Company" c
SET "nameKey" = keyed."key"
FROM keyed
WHERE c."id" = keyed."id"
  AND (SELECT count(*) FROM keyed other WHERE other."key" = keyed."key") = 1;

-- CreateIndex
CREATE UNIQUE INDEX "Company_nameKey_key" ON "Company"("nameKey");

