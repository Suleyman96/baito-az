import "server-only";
import { connection } from "next/server";
import { site } from "@/config/site";
import { db } from "@/lib/db";
import { cardInclude, visible } from "@/lib/jobs";
import { socialSelect } from "@/lib/social-links";

const DISTRICT_ORDER = Object.keys(site.districts);


/** Companies with at least one listed job, most active first. Blocked users' companies are left out. */
export async function getCompaniesWithJobs() {
  // Listings depend on the current time, so this runs per request, never at build time
  await connection();
  const now = new Date();
  const companies = await db.company.findMany({
    where: { owner: { blockedAt: null, deletedAt: null }, jobs: { some: visible(now) } },
    select: {
      id: true,
      name: true,
      description: true,
      owner: { select: { id: true, avatarId: true } },
      jobs: { where: visible(now), select: { location: { select: { district: { select: { slug: true } } } } } },
    },
  });
  return companies
    .map(({ jobs, ...c }) => ({
      ...c,
      jobCount: jobs.length,
      // Districts the company currently hires in, in the order the site lists them
      districts: [...new Set(jobs.map((j) => j.location.district.slug))].sort((a, b) => DISTRICT_ORDER.indexOf(a) - DISTRICT_ORDER.indexOf(b)),
    }))
    .sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name));
}

/** One company and its listed jobs, or null (missing, or its owner is blocked). */
export async function getCompany(id: string) {
  await connection();
  const now = new Date();
  return db.company.findFirst({
    where: { id, owner: { blockedAt: null, deletedAt: null } },
    select: {
      id: true,
      name: true,
      description: true,
      phone: true,
      address: true,
      latitude: true,
      longitude: true,
      owner: { select: { id: true, avatarId: true, ...socialSelect } },
      jobs: { where: visible(now), orderBy: { createdAt: "desc" }, include: cardInclude },
    },
  });
}

/** Number of listed jobs per category slug. */
export async function getCategoryCounts() {
  await connection();
  const [categories, counts] = await Promise.all([
    db.category.findMany({ select: { id: true, slug: true } }),
    db.job.groupBy({ by: ["categoryId"], where: visible(new Date()), _count: true }),
  ]);
  const byId = new Map(counts.map((c) => [c.categoryId, c._count]));
  return Object.fromEntries(categories.map((c) => [c.slug, byId.get(c.id) ?? 0])) as Record<string, number>;
}
