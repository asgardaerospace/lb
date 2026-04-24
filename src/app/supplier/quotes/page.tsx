import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { listSupplierInbox } from "@/lib/quotes/repository";

export const dynamic = "force-dynamic";

export default async function SupplierQuotesInboxPage() {
  let user;
  try {
    user = await requireRole(["supplier_admin", "supplier_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const inbox = await listSupplierInbox(user.organization_id);
  const canSubmit = user.role === "supplier_admin";

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Quotes</h1>
      {!canSubmit ? (
        <p className="mb-4 text-xs text-gray-500">
          You have read-only access. Only supplier_admin can submit or decline.
        </p>
      ) : null}
      {inbox.length === 0 ? (
        <p className="text-sm text-gray-600">No quote requests.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr>
              <th className="py-2">RFQ</th>
              <th className="py-2">Work package</th>
              <th className="py-2">Priority</th>
              <th className="py-2">Need-by</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {inbox.map((e) => (
              <tr key={e.routing_decision_id} className="border-b">
                <td className="py-2">
                  <Link
                    href={`/supplier/quotes/${e.routing_decision_id}`}
                    className="underline"
                  >
                    {e.rfq_title}
                  </Link>
                </td>
                <td className="py-2">{e.work_package_name}</td>
                <td className="py-2">{e.rfq_priority}</td>
                <td className="py-2">{e.rfq_required_delivery_date ?? "—"}</td>
                <td className="py-2">
                  {e.existing_quote
                    ? e.existing_quote.status
                    : "awaiting response"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
