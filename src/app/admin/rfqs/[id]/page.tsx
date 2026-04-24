import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import {
  getProgramById,
  getRfqById,
  listPartsForRfq,
} from "@/lib/rfq/repository";

export const dynamic = "force-dynamic";

export default async function AdminRfqDetailPage({
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
  const [program, parts] = await Promise.all([
    getProgramById(rfq.program_id),
    listPartsForRfq(id),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/admin/rfqs" className="text-sm text-gray-500 underline">
        ← Submitted RFQs
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{rfq.rfq_title}</h1>
      <p className="mb-6 text-sm text-gray-600">
        Status <span className="font-mono">{rfq.status}</span> · priority {rfq.priority}
        {program ? ` · program ${program.program_name}` : ""}
        {program?.itar_controlled ? " · ITAR" : ""}
        {program?.cui_controlled ? " · CUI" : ""}
      </p>
      {rfq.description ? (
        <p className="mb-6 text-sm">{rfq.description}</p>
      ) : null}

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
    </main>
  );
}
