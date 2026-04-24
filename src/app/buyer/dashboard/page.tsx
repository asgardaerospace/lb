import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import {
  listProgramsForOrg,
  listRfqsForOrg,
} from "@/lib/rfq/repository";

export const dynamic = "force-dynamic";

export default async function BuyerDashboardPage() {
  let user;
  try {
    user = await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const [programs, rfqs] = await Promise.all([
    listProgramsForOrg(user.organization_id),
    listRfqsForOrg(user.organization_id),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Buyer Dashboard</h1>
        <Link
          href="/buyer/programs/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          New program
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Programs</h2>
        {programs.length === 0 ? (
          <p className="text-sm text-gray-600">No programs yet.</p>
        ) : (
          <ul className="divide-y rounded border">
            {programs.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link
                    href={`/buyer/programs/${p.id}`}
                    className="font-medium underline"
                  >
                    {p.program_name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {p.program_type ?? "—"} · {p.status}
                    {p.itar_controlled ? " · ITAR" : ""}
                    {p.cui_controlled ? " · CUI" : ""}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">RFQs</h2>
        {rfqs.length === 0 ? (
          <p className="text-sm text-gray-600">No RFQs yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="py-2">Title</th>
                <th className="py-2">Status</th>
                <th className="py-2">Priority</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Need-by</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">
                    <Link href={`/buyer/rfqs/${r.id}`} className="underline">
                      {r.rfq_title}
                    </Link>
                  </td>
                  <td className="py-2">{r.status}</td>
                  <td className="py-2">{r.priority}</td>
                  <td className="py-2">{r.quantity ?? "—"}</td>
                  <td className="py-2">{r.required_delivery_date ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
