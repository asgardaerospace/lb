import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { getQuoteById } from "@/lib/quotes/repository";
import {
  getWorkPackageById,
  listPartsForWorkPackage,
} from "@/lib/routing/repository";
import { createServerSupabase } from "@/lib/supabase/server";
import QuoteReviewActions from "./QuoteReviewActions";

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({
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
  const quote = await getQuoteById(id);
  if (!quote) notFound();

  const supabase = await createServerSupabase();
  const [wp, parts, orgRow] = await Promise.all([
    getWorkPackageById(quote.work_package_id),
    listPartsForWorkPackage(quote.work_package_id),
    supabase
      .from("organizations")
      .select("id, name")
      .eq("id", quote.supplier_organization_id)
      .maybeSingle()
      .then(
        (r) => r.data as { id: string; name: string } | null,
      ),
  ]);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/admin/quotes" className="text-sm text-gray-500 underline">
        ← Quotes
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        Quote from {orgRow?.name ?? "(unknown)"}
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Status <span className="font-mono">{quote.status}</span>
        {wp ? ` · work package ${wp.package_name}` : ""}
      </p>

      <section className="mb-6 rounded border p-4 text-sm">
        <dl className="grid grid-cols-2 gap-2">
          <dt className="text-gray-500">Price</dt>
          <dd>{quote.quoted_price ?? "—"}</dd>
          <dt className="text-gray-500">Lead time (days)</dt>
          <dd>{quote.lead_time_days ?? "—"}</dd>
          <dt className="text-gray-500">Min order qty</dt>
          <dd>{quote.minimum_order_quantity ?? "—"}</dd>
          <dt className="text-gray-500">Submitted</dt>
          <dd>
            {quote.submitted_at
              ? new Date(quote.submitted_at).toLocaleString()
              : "—"}
          </dd>
          <dt className="text-gray-500">Notes</dt>
          <dd>{quote.quote_notes ?? "—"}</dd>
          {quote.review_notes ? (
            <>
              <dt className="text-gray-500">Review notes</dt>
              <dd>{quote.review_notes}</dd>
            </>
          ) : null}
        </dl>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-medium">Parts ({parts.length})</h2>
        {parts.length === 0 ? (
          <p className="text-sm text-gray-600">No parts.</p>
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

      <QuoteReviewActions quoteId={quote.id} status={quote.status} />
    </main>
  );
}
