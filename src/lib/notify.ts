import "server-only";
import { db } from "@/lib/db";
import { mailer } from "@/lib/mailer";
import { appUrl, buildApplicationEmail, deliver } from "@/lib/notification-email";

/**
 * Notifies the employer about a saved application: one notification row per application
 * (a retry finds the existing one), then an email attempt. Errors are logged, never thrown.
 */
export async function notifyNewApplication(applicationId: string) {
  try {
    const application = await db.application.findUniqueOrThrow({
      where: { id: applicationId },
      select: {
        createdAt: true,
        user: { select: { name: true } },
        job: { select: { title: true, company: { select: { owner: { select: { id: true, email: true } } } } } },
      },
    });
    const employer = application.job.company.owner;
    const notification = await db.notification.upsert({
      where: { applicationId },
      create: { applicationId, userId: employer.id },
      update: {},
    });

    const email = employer.email
      ? buildApplicationEmail({
          to: employer.email,
          applicantName: application.user.name,
          jobTitle: application.job.title,
          appliedAt: application.createdAt,
          link: `${appUrl()}/az/my/applications/${applicationId}`,
        })
      : null;
    const result = await deliver(notification.emailStatus, email, mailer);
    if (result) await db.notification.update({ where: { id: notification.id }, data: result });
  } catch (e) {
    console.error("Could not record the notification for application", applicationId, e);
  }
}
