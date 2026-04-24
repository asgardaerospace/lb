import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs/repository";
import AdminJobActions from "./AdminJobActions";

export const dynamic = "force-dynamic";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/admin/jobs" className="text-sm text-gray-500 underline">
        ← Jobs
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {job.job_number ?? job.id.slice(0, 8)}
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Status <span className="font-mono">{job.status}</span> · supplier org{" "}
        <span className="font-mono text-xs">
          {job.supplier_organization_id.slice(0, 8)}
        </span>
      </p>

      <section className="mb-6 rounded border p-4 text-sm">
        <dl className="grid grid-cols-2 gap-2">
          <dt className="text-gray-500">Start date</dt>
          <dd>{job.start_date ?? "—"}</dd>
          <dt className="text-gray-500">Due date</dt>
          <dd>{job.due_date ?? "—"}</dd>
          <dt className="text-gray-500">Completed date</dt>
          <dd>{job.completed_date ?? "—"}</dd>
          <dt className="text-gray-500">Last issue</dt>
          <dd>
            {job.last_issue_flagged_at ? (
              <>
                {new Date(job.last_issue_flagged_at).toLocaleString()}
                {job.last_issue_note ? ` · ${job.last_issue_note}` : ""}
              </>
            ) : (
              "—"
            )}
          </dd>
        </dl>
      </section>

      <AdminJobActions jobId={job.id} status={job.status} />
    </main>
  );
}
