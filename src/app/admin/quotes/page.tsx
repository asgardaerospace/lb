import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { listQuotesByStatus } from "@/lib/quotes/repository";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const quotes = await listQuotesByStatus(["submitted", "under_review"]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Submitted Quotes</h1>
      {quotes.length === 0 ? (
        <p className="text-sm text-gray-600">No quotes awaiting review.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr>
              <th className="py-2">Quote ID</th>
              <th className="py-2">Work package</th>
              <th className="py-2">Supplier org</th>
              <th className="py-2">Price</th>
              <th className="py-2">Lead (days)</th>
              <th className="py-2">MOQ</th>
              <th className="py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-b">
                <td className="py-2 font-mono text-xs">
                  <Link href={`/admin/quotes/${q.id}`} className="underline">
                    {q.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="py-2 font-mono text-xs">
                  {q.work_package_id.slice(0, 8)}
                </td>
                <td className="py-2 font-mono text-xs">
                  {q.supplier_organization_id.slice(0, 8)}
                </td>
                <td className="py-2">{q.quoted_price ?? "—"}</td>
                <td className="py-2">{q.lead_time_days ?? "—"}</td>
                <td className="py-2">{q.minimum_order_quantity ?? "—"}</td>
                <td className="py-2">
                  {q.submitted_at
                    ? new Date(q.submitted_at).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
