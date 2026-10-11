import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { JobFilters } from "@/lib/filters";

export const PAGE_SIZE = 10;

export async function searchJobs(filters: JobFilters) {
  const where: Prisma.JobWhereInput = {
    status: "ACTIVE",
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
      include: { company: { select: { name: true } }, category: true, location: { include: { district: true } } },
    }),
    db.job.count({ where }),
  ]);

  return { jobs, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function getActiveJob(id: string) {
  return db.job.findFirst({
    where: { id, status: "ACTIVE" },
    include: { company: true, category: true, location: { include: { district: true } } },
  });
}

export function getFilterOptions() {
  return Promise.all([
    db.category.findMany({ orderBy: { id: "asc" } }),
    db.district.findMany({
      orderBy: { id: "asc" },
      include: { locations: { orderBy: { id: "asc" }, select: { id: true, name: true } } },
    }),
  ]);
}
