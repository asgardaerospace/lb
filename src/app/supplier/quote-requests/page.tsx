import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { listQuoteRequestsForSupplier } from "@/lib/routing/repository";

export const dynamic = "force-dynamic";

export default async function SupplierQuoteRequestsPage() {
  let user;
  try {
    user = await requireRole(["supplier_admin", "supplier_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const requests = await listQuoteRequestsForSupplier(user.organization_id);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Quote Requests</h1>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-600">No quote requests.</p>
      ) : (
        <ul className="space-y-6">
          {requests.map((r) => (
            <li key={r.routing_decision_id} className="rounded border p-4">
              <h2 className="text-lg font-medium">{r.rfq_title}</h2>
              <p className="mb-3 text-xs text-gray-500">
                Priority {r.rfq_priority}
                {r.rfq_required_delivery_date
                  ? ` · need-by ${r.rfq_required_delivery_date}`
                  : ""}
                {r.quote_requested_at
                  ? ` · requested ${new Date(
                      r.quote_requested_at,
                    ).toLocaleString()}`
                  : ""}
              </p>
              {r.rfq_description ? (
                <p className="mb-3 text-sm">{r.rfq_description}</p>
              ) : null}
              <p className="mb-1 text-sm font-medium">
                Parts ({r.parts.length})
              </p>
              {r.parts.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No parts on this package.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2">Part #</th>
                      <th className="py-2">Material</th>
                      <th className="py-2">Process</th>
                      <th className="py-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.parts.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2 font-mono text-xs">
                          {p.part_number}
                        </td>
                        <td className="py-2">{p.material ?? "—"}</td>
                        <td className="py-2">{p.process_required ?? "—"}</td>
                        <td className="py-2">{p.quantity ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="mt-3 text-xs text-gray-500">
                Quote submission is not yet implemented — coming in task 04.
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
