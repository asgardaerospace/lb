import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { loadRfqForOrg } from "@/lib/rfq/access";
import {
  getProgramById,
  listPartsForRfq,
} from "@/lib/rfq/repository";
import RfqEditor from "./RfqEditor";

export const dynamic = "force-dynamic";

export default async function RfqPage({
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
  let rfq;
  try {
    rfq = await loadRfqForOrg(id, user.organization_id);
  } catch (err) {
    if (err instanceof AuthError && (err.status === 403 || err.status === 404)) {
      notFound();
    }
    throw err;
  }
  const [program, parts] = await Promise.all([
    getProgramById(rfq.program_id),
    listPartsForRfq(id),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href={`/buyer/programs/${rfq.program_id}`}
        className="text-sm text-gray-500 underline"
      >
        ← {program?.program_name ?? "Program"}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{rfq.rfq_title}</h1>
      <p className="mb-6 text-sm text-gray-600">
        Status <span className="font-mono">{rfq.status}</span> · priority {rfq.priority}
      </p>
      <RfqEditor rfq={rfq} initialParts={parts} />
    </main>
  );
}
