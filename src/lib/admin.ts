import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { bakuMidnight } from "@/lib/format";
import { visible } from "@/lib/jobs";

const LIST_LIMIT = 100;
const DAY = 24 * 60 * 60 * 1000;


export function getPendingCount() {
  return db.job.count({ where: { status: "PENDING", company: { owner: { blockedAt: null } } } });
}

export async function getAdminStats(now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const [pending, active, oneDaySoon, newUsers, totalUsers, blocked] = await Promise.all([
    getPendingCount(),
    db.job.count({ where: visible(now) }),
    db.job.count({
      where: { ...visible(now), employmentType: "ONE_DAY", workStart: { gt: now, lt: bakuMidnight(now, 2) } },
    }),
    db.user.groupBy({ by: ["role"], where: { createdAt: { gte: weekAgo } }, _count: true }),
    db.user.count(),
    db.user.count({ where: { blockedAt: { not: null } } }),
  ]);
  const newByRole = (role: "SEEKER" | "EMPLOYER") => newUsers.find((g) => g.role === role)?._count ?? 0;
  return { pending, active, oneDaySoon, newSeekers: newByRole("SEEKER"), newEmployers: newByRole("EMPLOYER"), totalUsers, blocked };
}

// "EXPIRED" is not stored: it is an approved one-day job whose start time has passed
export const ADMIN_JOB_TABS = ["PENDING", "ACTIVE", "EXPIRED", "REJECTED", "CLOSED"] as const;
export type AdminJobTab = (typeof ADMIN_JOB_TABS)[number];

const adminJobsQuery = z.object({
  tab: z.enum(ADMIN_JOB_TABS).catch("PENDING"),
  q: z.string().trim().max(100).optional().catch(undefined),
});

export function parseAdminJobsQuery(searchParams: Record<string, string | string[] | undefined>) {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  return adminJobsQuery.parse({ tab: first(searchParams.tab), q: first(searchParams.q) });
}

export async function getAdminJobs({ tab, q }: z.infer<typeof adminJobsQuery>, now = new Date()) {
  const byTab: Record<AdminJobTab, Prisma.JobWhereInput> = {
    PENDING: { status: "PENDING", company: { owner: { blockedAt: null } } },
    ACTIVE: { status: "ACTIVE", OR: [{ employmentType: { not: "ONE_DAY" } }, { workStart: { gt: now } }] },
    EXPIRED: { status: "ACTIVE", employmentType: "ONE_DAY", workStart: { lte: now } },
    REJECTED: { status: "REJECTED" },
    CLOSED: { status: "CLOSED" },
  };
  const where: Prisma.JobWhereInput = {
    AND: [
      byTab[tab],
      q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
              { company: { owner: { name: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {},
    ],
  };

  const [jobs, counts] = await Promise.all([
    db.job.findMany({
      where,
      // The review queue is first come, first served; other tabs show newest first
      orderBy: { createdAt: tab === "PENDING" ? "asc" : "desc" },
      take: LIST_LIMIT,
      include: {
        company: { include: { owner: { select: { name: true, phone: true, email: true, blockedAt: true } } } },
        // Admins review the images too
        images: { select: { id: true }, orderBy: { position: "asc" } },
        category: true,
        location: { include: { district: true } },
      },
    }),
    Promise.all(ADMIN_JOB_TABS.map((t) => db.job.count({ where: byTab[t] }))),
  ]);
  return { jobs, counts: Object.fromEntries(ADMIN_JOB_TABS.map((t, i) => [t, counts[i]])) as Record<AdminJobTab, number> };
}

const adminUsersQuery = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  role: z.enum(["SEEKER", "EMPLOYER", "ADMIN"]).optional().catch(undefined),
});

export function parseAdminUsersQuery(searchParams: Record<string, string | string[] | undefined>) {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  return adminUsersQuery.parse({ q: first(searchParams.q), role: first(searchParams.role) });
}

export function getAdminUsers({ q, role }: z.infer<typeof adminUsersQuery>) {
  // Phone numbers are stored as +994XXXXXXXXX; searching by digits finds "050 123..." typed with spaces too
  const digits = q?.replace(/\D/g, "").replace(/^0/, "");
  return db.user.findMany({
    where: {
      role,
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            ...(digits && digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
            { company: { name: { contains: q, mode: "insensitive" } } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      blockedAt: true,
      avatarId: true,
      createdAt: true,
      company: { select: { name: true, _count: { select: { jobs: true } } } },
      _count: { select: { applications: true } },
    },
  });
}
