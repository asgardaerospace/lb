import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { listRfqsByStatus } from "@/lib/rfq/repository";

export const dynamic = "force-dynamic";

export default async function AdminRfqsPage() {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const rfqs = await listRfqsByStatus(["submitted"]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Submitted RFQs</h1>
      {rfqs.length === 0 ? (
        <p className="text-sm text-gray-600">No submitted RFQs.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr>
              <th className="py-2">Title</th>
              <th className="py-2">Priority</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Need-by</th>
              <th className="py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">
                  <Link href={`/admin/rfqs/${r.id}`} className="underline">
                    {r.rfq_title}
                  </Link>
                </td>
                <td className="py-2">{r.priority}</td>
                <td className="py-2">{r.quantity ?? "—"}</td>
                <td className="py-2">{r.required_delivery_date ?? "—"}</td>
                <td className="py-2">
                  {r.submitted_at
                    ? new Date(r.submitted_at).toLocaleString()
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
