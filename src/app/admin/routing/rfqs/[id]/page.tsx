import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { getRfqById, listPartsForRfq } from "@/lib/rfq/repository";
import { listWorkPackagesForRfq } from "@/lib/routing/repository";
import WorkPackageCreateForm from "./WorkPackageCreateForm";

export const dynamic = "force-dynamic";

export default async function RoutingRfqPage({
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
  const rfq = await getRfqById(id);
  if (!rfq) notFound();

  const [parts, packages] = await Promise.all([
    listPartsForRfq(id),
    listWorkPackagesForRfq(id),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link href="/admin/routing" className="text-sm text-gray-500 underline">
        ← Routing queue
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{rfq.rfq_title}</h1>
      <p className="mb-6 text-sm text-gray-600">
        Status <span className="font-mono">{rfq.status}</span> · priority {rfq.priority}
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Parts ({parts.length})</h2>
        {parts.length === 0 ? (
          <p className="text-sm text-gray-600">No parts on this RFQ.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="py-2">Part #</th>
                <th className="py-2">Name</th>
                <th className="py-2">Material</th>
                <th className="py-2">Process</th>
                <th className="py-2">Qty</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 font-mono text-xs">{p.part_number}</td>
                  <td className="py-2">{p.part_name ?? "—"}</td>
                  <td className="py-2">{p.material ?? "—"}</td>
                  <td className="py-2">{p.process_required ?? "—"}</td>
                  <td className="py-2">{p.quantity ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">
          Work packages ({packages.length})
        </h2>
        {packages.length === 0 ? (
          <p className="text-sm text-gray-600">No work packages yet.</p>
        ) : (
          <ul className="divide-y rounded border">
            {packages.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <Link
                  href={`/admin/work-packages/${p.id}`}
                  className="underline"
                >
                  {p.package_name}
                </Link>
                <span className="text-xs">
                  {p.package_type ?? "—"} · {p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">New work package</h2>
        <WorkPackageCreateForm rfqId={id} />
      </section>
    </main>
  );
}
