import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { JobFormLoader } from "@/components/JobFormLoader";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth/session";
import { updateJob } from "@/lib/job-actions";
import { jobToFormValues } from "@/lib/job-form";
import { getOwnedJob } from "@/lib/jobs";

export default async function EditJobPage({ params }: PageProps<"/[lang]/jobs/[id]/edit">) {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-line bg-surface p-5 sm:p-6">
      <h1 className="mb-2 text-2xl font-bold">{dict.manageJob.editTitle}</h1>
      <p className="mb-5 text-sm text-muted">{dict.manageJob.editNote}</p>
      <Suspense fallback={<p className="text-muted">{dict.home.loading}</p>}>
        <EditJob lang={lang} dict={dict} params={params} />
      </Suspense>
    </div>
  );
}

async function EditJob({ lang, dict, params }: { lang: Locale; dict: Dictionary; params: PageProps<"/[lang]/jobs/[id]/edit">["params"] }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/jobs/${id}/edit`)}`);
  // Someone else's job looks the same as a missing one
  const job = await getOwnedJob(user.id, id);
  if (!job) notFound();

  return (
    <JobFormLoader
      userId={user.id}
      lang={lang}
      dict={dict}
      action={updateJob.bind(null, job.id)}
      initial={jobToFormValues(job)}
      existingImages={job.images.map((i) => i.id)}
      submitLabel={dict.manageJob.save}
    />
  );
}
