import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { loadRequestForSupplier } from "@/lib/quotes/access";
import { getQuoteFor } from "@/lib/quotes/repository";
import { listPartsForWorkPackage } from "@/lib/routing/repository";
import { createServerSupabase } from "@/lib/supabase/server";
import QuoteResponseForm from "./QuoteResponseForm";

export const dynamic = "force-dynamic";

export default async function SupplierQuoteDetailPage({
  params,
}: {
  params: Promise<{ rdId: string }>;
}) {
  let user;
  try {
    user = await requireRole(["supplier_admin", "supplier_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const { rdId } = await params;
  let rd;
  try {
    rd = await loadRequestForSupplier(rdId, user.organization_id);
  } catch (err) {
    if (err instanceof AuthError && (err.status === 403 || err.status === 404)) {
      notFound();
    }
    throw err;
  }

  const supabase = await createServerSupabase();
  const { data: wpRow } = await supabase
    .from("work_packages")
    .select("id, package_name, package_type, description, rfq_id")
    .eq("id", rd.work_package_id)
    .maybeSingle();
  const wp = wpRow as {
    id: string;
    package_name: string;
    package_type: string | null;
    description: string | null;
    rfq_id: string;
  } | null;
  if (!wp) notFound();

  const { data: rfqRow } = await supabase
    .from("rfqs")
    .select("rfq_title, description, priority, required_delivery_date")
    .eq("id", wp.rfq_id)
    .maybeSingle();
  const rfq = rfqRow as {
    rfq_title: string;
    description: string | null;
    priority: string;
    required_delivery_date: string | null;
  } | null;

  const [parts, existing] = await Promise.all([
    listPartsForWorkPackage(wp.id),
    getQuoteFor(wp.id, user.organization_id),
  ]);

  const canAct = user.role === "supplier_admin";

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/supplier/quotes" className="text-sm text-gray-500 underline">
        ← Quotes
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {rfq?.rfq_title ?? "Quote request"}
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Work package: {wp.package_name}
        {wp.package_type ? ` · ${wp.package_type}` : ""}
        {rfq ? ` · priority ${rfq.priority}` : ""}
        {rfq?.required_delivery_date
          ? ` · need-by ${rfq.required_delivery_date}`
          : ""}
      </p>
      {wp.description ? (
        <p className="mb-4 text-sm">{wp.description}</p>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Parts ({parts.length})</h2>
        {parts.length === 0 ? (
          <p className="text-sm text-gray-600">No parts attached.</p>
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
              {parts.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 font-mono text-xs">{p.part_number}</td>
                  <td className="py-2">{p.material ?? "—"}</td>
                  <td className="py-2">{p.process_required ?? "—"}</td>
                  <td className="py-2">{p.quantity ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <QuoteResponseForm
        routingDecisionId={rd.id}
        existing={existing}
        canAct={canAct}
      />
    </main>
  );
}
