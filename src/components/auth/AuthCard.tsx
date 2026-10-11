import type { ReactNode } from "react";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-line bg-surface p-5 sm:p-6">
      <h1 className="mb-5 text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
