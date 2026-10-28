import "server-only";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/** Shown wherever a deleted user's name used to appear (reviews, applications, offers) */
export const DELETED_USER_NAME = "Silinmiş istifadəçi";

/**
 * Deletes a profile without breaking other people's records. The User row stays (soft delete), so
 * the employer's received applications, the seeker's employers' jobs, reviews and offers that the
 * other side answered keep their history; everything personal is removed or cleared:
 * - contacts, photo, social links, CVs, the worker profile and its portfolio are deleted;
 * - email and phone are freed, so the person can register again with them;
 * - the employer's open jobs are closed, the company page is hidden and its name freed;
 * - open offers to or from the user are withdrawn; every session and password reset link ends.
 * One transaction: either all of it happens or none.
 */
export async function softDeleteUser(userId: string) {
  const { avatarId } = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { avatarId: true } });
  // No one can log in with this: the password is unknown and email/phone are gone
  const passwordHash = await bcrypt.hash(randomUUID(), 10);

  await db.$transaction([
    db.job.updateMany({ where: { company: { ownerId: userId }, status: { in: ["PENDING", "ACTIVE"] } }, data: { status: "CLOSED" } }),
    db.job.updateMany({ where: { company: { ownerId: userId } }, data: { contactPhone: null } }),
    db.company.updateMany({
      where: { ownerId: userId },
      data: { nameKey: null, description: null, phone: null, address: null, latitude: null, longitude: null },
    }),
    db.workerProfile.deleteMany({ where: { userId } }),
    db.jobOffer.deleteMany({ where: { status: "PENDING", OR: [{ employerId: userId }, { workerId: userId }] } }),
    db.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        name: DELETED_USER_NAME,
        email: null,
        phone: null,
        passwordHash,
        avatarId: null,
        resumeId: null,
        instagram: null,
        facebook: null,
        tiktok: null,
        whatsapp: null,
        telegram: null,
      },
    }),
    // Applications keep their row; their CV link becomes empty (onDelete: SetNull)
    db.resume.deleteMany({ where: { ownerId: userId } }),
    ...(avatarId ? [db.image.deleteMany({ where: { id: avatarId } })] : []),
    db.session.deleteMany({ where: { userId } }),
    db.passwordResetToken.deleteMany({ where: { userId } }),
  ]);
}
