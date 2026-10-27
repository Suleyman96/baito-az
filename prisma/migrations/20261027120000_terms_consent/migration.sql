-- Two optional columns only: when and which version of the Terms of Use and Privacy Policy a user
-- accepted at sign-up. Existing rows keep NULL (no consent was recorded for them); no data is changed.
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;
