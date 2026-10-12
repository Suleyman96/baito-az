import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

/** Admin pages return 404 to everyone else, so their existence is not advertised. */
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") notFound();
  return user;
}
