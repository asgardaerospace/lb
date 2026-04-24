import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import {
  getProgramById,
  listRfqsForProgram,
} from "@/lib/rfq/repository";
import RfqCreateForm from "./RfqCreateForm";

export const dynamic = "force-dynamic";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let user;
  try {
    user = await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const { id } = await params;
  const program = await getProgramById(id);
  if (!program || program.buyer_organization_id !== user.organization_id) {
    notFound();
  }
  const rfqs = await listRfqsForProgram(id);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/buyer/dashboard" className="text-sm text-gray-500 underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{program.program_name}</h1>
      <p className="mb-6 text-sm text-gray-600">
        {program.program_type ?? "—"} · status {program.status}
        {program.itar_controlled ? " · ITAR" : ""}
        {program.cui_controlled ? " · CUI" : ""}
        {program.compliance_level ? ` · ${program.compliance_level}` : ""}
      </p>
      {program.description ? (
        <p className="mb-6 text-sm">{program.description}</p>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">RFQs</h2>
        {rfqs.length === 0 ? (
          <p className="text-sm text-gray-600">No RFQs yet.</p>
        ) : (
          <ul className="divide-y rounded border">
            {rfqs.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <Link href={`/buyer/rfqs/${r.id}`} className="underline">
                  {r.rfq_title}
                </Link>
                <span className="text-xs">
                  {r.status} · {r.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">New RFQ</h2>
        <RfqCreateForm programId={program.id} />
      </section>
    </main>
  );
}
