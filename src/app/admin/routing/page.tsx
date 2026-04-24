import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireAsgardAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface QueueRow {
  id: string;
  rfq_title: string;
  priority: string;
  status: string;
  submitted_at: string | null;
  required_delivery_date: string | null;
}

export default async function RoutingQueuePage() {
  try {
    await requireAsgardAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("rfqs")
    .select(
      "id, rfq_title, priority, status, submitted_at, required_delivery_date",
    )
    .in("status", ["submitted", "routing_in_progress"])
    .order("submitted_at", { ascending: false, nullsFirst: false });

  const rows = (data ?? []) as QueueRow[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Routing Queue</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-600">No RFQs awaiting routing.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr>
              <th className="py-2">Title</th>
              <th className="py-2">Status</th>
              <th className="py-2">Priority</th>
              <th className="py-2">Need-by</th>
              <th className="py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">
                  <Link
                    href={`/admin/routing/rfqs/${r.id}`}
                    className="underline"
                  >
                    {r.rfq_title}
                  </Link>
                </td>
                <td className="py-2">{r.status}</td>
                <td className="py-2">{r.priority}</td>
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
