import { redirect } from "next/navigation";
import { Suspense } from "react";
import { JobFormLoader } from "@/components/JobFormLoader";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { createJob } from "@/lib/job-actions";
import { jobToFormValues } from "@/lib/job-form";
import { getOwnedJob } from "@/lib/jobs";

export default async function NewJobPage({ searchParams }: PageProps<"/[lang]/jobs/new">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-line bg-surface p-5 sm:p-6">
      <h1 className="mb-5 text-2xl font-bold">{dict.postJob.title}</h1>
      <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
        <NewJob lang={lang} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewJob({
  lang,
  dict,
  searchParams,
}: {
  lang: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/jobs/new">["searchParams"];
}) {
  const user = await getCurrentUser();
  // Not logged in: sign up as an employer, then come back here
  if (!user) redirect(`/${lang}/register?role=EMPLOYER&next=${encodeURIComponent(`/${lang}/jobs/new`)}`);
  if (user.role !== "EMPLOYER") return <p className="text-muted">{dict.postJob.employersOnly}</p>;

  // ?from=<id>: start from a copy of one of the employer's own jobs
  const { from } = await searchParams;
  const source = typeof from === "string" ? await getOwnedJob(user.id, from) : null;

  return (
    <JobFormLoader
      userId={user.id}
      lang={lang}
      dict={dict}
      action={createJob}
      initial={source ? jobToFormValues(source, { copy: true }) : undefined}
    />
  );
}
