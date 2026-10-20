import "server-only";
import { connection } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { DISTRICT_SLUGS } from "@/config/site";
import type { JobFilters } from "@/lib/filters";

export const PAGE_SIZE = 10;

/** What a job card shows: company name and logo (the employer's photo), category, place and the first image. */
export const cardInclude = {
  company: { select: { name: true, owner: { select: { avatarId: true } } } },
  category: true,
  location: { include: { district: true } },
  images: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
} as const satisfies Prisma.JobInclude;

// Publicly listed: approved, posted by a user who is not blocked, and for one-day jobs not yet started
export function visible(now: Date): Prisma.JobWhereInput {
  return {
    status: "ACTIVE",
    company: { owner: { blockedAt: null, deletedAt: null } },
    OR: [{ employmentType: { not: "ONE_DAY" } }, { workStart: { gt: now } }],
  };
}

/**
 * Jobs whose pay range overlaps [min, max]. A job states a range (salaryMin–salaryMax) or one bound;
 * jobs with no amount ("negotiable") never match an amount filter.
 */
export function payOverlaps(min?: number, max?: number): Prisma.JobWhereInput[] {
  const where: Prisma.JobWhereInput[] = [];
  if (min) where.push({ OR: [{ salaryMax: { gte: min } }, { salaryMax: null, salaryMin: { gte: min } }] });
  if (max) where.push({ OR: [{ salaryMin: { lte: max } }, { salaryMin: null, salaryMax: { lte: max } }] });
  return where;
}

export async function searchJobs(filters: JobFilters, { excludeOneDay = false } = {}) {
  await connection();
  const where: Prisma.JobWhereInput = {
    AND: [
      visible(new Date()),
      ...payOverlaps(filters.payMin, filters.payMax),
      ...(excludeOneDay ? [{ employmentType: { not: "ONE_DAY" as const } }] : []),
    ],
    payPeriod: filters.pay,
    employmentType: filters.type,
    location: { id: filters.location, district: filters.district ? { slug: filters.district } : undefined },
    category: filters.category ? { slug: filters.category } : undefined,
    OR: filters.q
      ? [
          { title: { contains: filters.q, mode: "insensitive" } },
          { description: { contains: filters.q, mode: "insensitive" } },
          { company: { name: { contains: filters.q, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: cardInclude,
    }),
    db.job.count({ where }),
  ]);

  return { jobs, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function getActiveJob(id: string) {
  return db.job.findFirst({
    where: { id, ...visible(new Date()) },
    include: {
      company: { include: { owner: { select: { avatarId: true } } } },
      category: true,
      location: { include: { district: true } },
      images: { select: { id: true }, orderBy: { position: "asc" } },
    },
  });
}

export function getFilterOptions() {
  return Promise.all([
    db.category.findMany({ orderBy: { id: "asc" } }),
    // Every city and district, in Azerbaijani alphabetical order. Their places are loaded per district
    // (getDistrictPlaces / the locations API), not all ~4,600 at once
    db.district
      .findMany({ select: { id: true, slug: true } })
      .then((ds) => ds.filter((d) => DISTRICT_SLUGS.includes(d.slug)).sort((a, b) => DISTRICT_SLUGS.indexOf(a.slug) - DISTRICT_SLUGS.indexOf(b.slug))),
  ]);
}

/**
 * The places of one city or district for a picker: its city or town first, then settlements and
 * villages. Places the official classification does not list are left out, except `includeId`
 * (one already chosen on a job or profile, so editing it keeps working).
 */
export function getDistrictPlaces(slug: string, includeId?: number) {
  return db.location.findMany({
    where: { district: { slug }, OR: [{ code: { not: null } }, ...(includeId ? [{ id: includeId }] : [])] },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

/** All jobs of one employer, any status, for their "My jobs" page. */
export function getJobsByOwner(userId: string) {
  return db.job.findMany({
    where: { company: { ownerId: userId } },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      location: { include: { district: true } },
      images: { select: { id: true }, orderBy: { position: "asc" }, take: 1 },
      applications: { select: { status: true } },
    },
  });
}


/** A job of this employer (any status), or null if it is someone else's. */
export function getOwnedJob(userId: string, id: string) {
  return db.job.findFirst({
    where: { id, company: { ownerId: userId } },
    include: { location: { include: { district: true } }, images: { select: { id: true }, orderBy: { position: "asc" } } },
  });
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** One-day jobs starting within the next week, soonest first (home page strip). */
export async function getUpcomingOneDayJobs(limit = 4) {
  // Listings depend on the current time, so this runs per request, never at build time
  await connection();
  const now = new Date();
  return db.job.findMany({
    where: { ...visible(now), employmentType: "ONE_DAY", workStart: { gt: now, lt: new Date(now.getTime() + WEEK) } },
    orderBy: { workStart: "asc" },
    take: limit,
    include: cardInclude,
  });
}

/** Numbers for the hero line: listed jobs, and one-day jobs in the coming week. */
export async function getHomeStats() {
  await connection();
  const now = new Date();
  const [active, oneDayThisWeek] = await Promise.all([
    db.job.count({ where: visible(now) }),
    db.job.count({ where: { ...visible(now), employmentType: "ONE_DAY", workStart: { gt: now, lt: new Date(now.getTime() + WEEK) } } }),
  ]);
  return { active, oneDayThisWeek };
}
