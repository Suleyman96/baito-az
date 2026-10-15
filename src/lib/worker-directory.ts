import "server-only";
import { connection } from "next/server";
import { matchingSlugs, professionsInGroup } from "@/config/professions";
import type { Prisma } from "@/generated/prisma/client";
import { bakuMidnight } from "@/lib/format";
import { db } from "@/lib/db";
import type { WorkerFilters } from "@/lib/worker-filters";

export const DIRECTORY_PAGE_SIZE = 12;
// A rural directory stays small; sorting by rating is done in memory over at most this many matches
const MAX_MATCHES = 500;

/**
 * Everything a public profile may show. Deliberately no email, phone or password fields:
 * they are never read, so they cannot leak into a page or a response.
 */
const publicProfile = {
  id: true,
  ageRange: true,
  bio: true,
  primaryProfession: true,
  additionalProfessions: true,
  skills: true,
  experienceYears: true,
  workHistory: true,
  certificates: true,
  district: true,
  location: { select: { name: true } },
  preferredDistricts: true,
  maxCommuteKm: true,
  willingToRelocate: true,
  workTypes: true,
  availableFrom: true,
  availableWeekdays: true,
  availableWeekends: true,
  expectedPay: true,
  expectedPayPeriod: true,
  workplace: true,
  visible: true,
  updatedAt: true,
  portfolio: { select: { id: true }, orderBy: { position: "asc" } },
  user: { select: { id: true, name: true, avatarId: true, createdAt: true } },
} as const satisfies Prisma.WorkerProfileSelect;

/** Who can appear in the directory: visible profiles of job seekers who are not blocked. */
const listed: Prisma.WorkerProfileWhereInput = { visible: true, user: { role: "SEEKER", blockedAt: null } };

/** Ratings and completed jobs for several users at once. */
async function trustFor(userIds: string[]) {
  const [ratings, completed] = await Promise.all([
    db.review.groupBy({ by: ["subjectId"], where: { subjectId: { in: userIds } }, _avg: { rating: true }, _count: true }),
    db.application.groupBy({ by: ["userId"], where: { userId: { in: userIds }, status: "ACCEPTED", job: { status: "COMPLETED" } }, _count: true }),
  ]);
  const rating = new Map(ratings.map((r) => [r.subjectId, { average: r._avg.rating === null ? null : Math.round(r._avg.rating * 10) / 10, count: r._count }]));
  const done = new Map(completed.map((c) => [c.userId, c._count]));
  return (id: string) => ({ rating: rating.get(id) ?? { average: null, count: 0 }, completedJobs: done.get(id) ?? 0 });
}

export async function searchWorkers(filters: WorkerFilters) {
  // Availability "now" depends on today's date, so this always runs per request
  await connection();
  const q = filters.q;
  const matched = q ? matchingSlugs(q) : null;
  const and: Prisma.WorkerProfileWhereInput[] = [listed];
  if (q && matched) {
    and.push({
      OR: [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { primaryProfession: { in: matched.professions } },
        { additionalProfessions: { hasSome: matched.professions } },
        { skills: { hasSome: matched.skills } },
      ],
    });
  }
  if (filters.profession) and.push({ OR: [{ primaryProfession: filters.profession }, { additionalProfessions: { has: filters.profession } }] });
  else if (filters.group) {
    const inGroup = professionsInGroup(filters.group);
    and.push({ OR: [{ primaryProfession: { in: inGroup } }, { additionalProfessions: { hasSome: inGroup } }] });
  }
  if (filters.district) and.push({ OR: [{ district: filters.district }, { preferredDistricts: { has: filters.district } }] });
  if (filters.type) and.push({ workTypes: { has: filters.type } });
  if (filters.exp) and.push({ experienceYears: { gte: filters.exp } });
  if (filters.payMax) and.push({ expectedPayPeriod: filters.pay, OR: [{ expectedPay: null }, { expectedPay: { lte: filters.payMax } }] });
  if (filters.avail === "weekdays") and.push({ availableWeekdays: true });
  if (filters.avail === "weekends") and.push({ availableWeekends: true });
  if (filters.avail === "now") and.push({ OR: [{ availableFrom: null }, { availableFrom: { lt: bakuMidnight(new Date(), 1) } }] });

  const profiles = await db.workerProfile.findMany({ where: { AND: and }, orderBy: { updatedAt: "desc" }, take: MAX_MATCHES, select: publicProfile });
  const trust = await trustFor(profiles.map((p) => p.user.id));
  const withTrust = profiles.map((p) => ({ ...p, ...trust(p.user.id) }));

  if (filters.sort === "rating") {
    withTrust.sort((a, b) => (b.rating.average ?? 0) - (a.rating.average ?? 0) || b.rating.count - a.rating.count);
  } else if (q) {
    // Relevance: a name or main-profession match before matches in extra professions or skills
    const needle = q.toLocaleLowerCase();
    const score = (p: (typeof withTrust)[number]) =>
      (p.user.name.toLocaleLowerCase().includes(needle) ? 2 : 0) + (matched!.professions.includes(p.primaryProfession) ? 2 : 0);
    withTrust.sort((a, b) => score(b) - score(a));
  }

  const total = withTrust.length;
  const start = (filters.page - 1) * DIRECTORY_PAGE_SIZE;
  return {
    workers: withTrust.slice(start, start + DIRECTORY_PAGE_SIZE),
    total,
    pageCount: Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE)),
  };
}

/** A work profile for its public page: shown when visible, or to its owner. Null when there is none to show. */
export async function getPublicWorkerProfile(userId: string, viewerId: string | null) {
  const profile = await db.workerProfile.findFirst({
    where: { userId, user: { role: "SEEKER", blockedAt: null }, ...(viewerId === userId ? {} : { visible: true }) },
    select: publicProfile,
  });
  if (!profile) return null;
  return { ...profile, ...(await trustFor([userId]))(userId) };
}

/** The owner's own profile for the edit form (no public/private split needed: it is their data). */
export function getOwnWorkerProfile(userId: string) {
  return db.workerProfile.findUnique({
    where: { userId },
    include: { portfolio: { select: { id: true }, orderBy: { position: "asc" } } },
  });
}
