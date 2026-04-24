import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { listJobsForBuyer } from "@/lib/jobs/repository";

export const dynamic = "force-dynamic";

export default async function BuyerJobsPage() {
  let user;
  try {
    user = await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const jobs = await listJobsForBuyer(user.organization_id);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Job Progress</h1>
      <p className="mb-4 text-xs text-gray-500">
        Read-only view of jobs for RFQs on your programs.
      </p>
      {jobs.length === 0 ? (
        <p className="text-sm text-gray-600">No jobs yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr>
              <th className="py-2">Job</th>
              <th className="py-2">Status</th>
              <th className="py-2">Start</th>
              <th className="py-2">Due</th>
              <th className="py-2">Completed</th>
              <th className="py-2">Issue</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b">
                <td className="py-2 font-mono text-xs">
                  {j.job_number ?? j.id.slice(0, 8)}
                </td>
                <td className="py-2">{j.status}</td>
                <td className="py-2">{j.start_date ?? "—"}</td>
                <td className="py-2">{j.due_date ?? "—"}</td>
                <td className="py-2">{j.completed_date ?? "—"}</td>
                <td className="py-2">
                  {j.last_issue_flagged_at ? "⚠" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
