-- Password reset links an admin makes for accounts without email: the link has no email, and records
-- which admin made it. Existing rows keep their email; no data is removed.
-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "createdById" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
