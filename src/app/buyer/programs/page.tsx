import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import { listProgramsForOrg } from "@/lib/rfq/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, EmptyState, LinkButton, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BuyerProgramsListPage() {
  let user;
  try {
    user = await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  const programs = await listProgramsForOrg(user.organization_id);

  return (
    <>
      <PageHeader
        eyebrow="Buyer · Programs"
        title="Programs"
        subtitle="All programs associated with your account. Open a program to manage RFQs and parts."
        actions={
          <LinkButton href="/buyer/programs/new" variant="primary" size="sm">
            + Submit New Program
          </LinkButton>
        }
      />

      {programs.length === 0 ? (
        <EmptyState
          title="No programs yet"
          body="Programs are the parent container for RFQs, parts, and production activity."
          action={
            <LinkButton href="/buyer/programs/new" variant="primary" size="sm">
              + Submit New Program
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                {p.program_type ?? "Program"}
              </div>
              <Link
                href={`/buyer/programs/${p.id}`}
                className="text-base font-semibold text-slate-100 transition hover:text-cyan-300"
              >
                {p.program_name}
              </Link>
              <p className="mt-1 line-clamp-3 text-xs text-slate-400">
                {p.description ?? "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <StatusBadge
                  tone={p.status === "active" ? "success" : "neutral"}
                >
                  {p.status}
                </StatusBadge>
                {p.itar_controlled && <StatusBadge tone="warn">ITAR</StatusBadge>}
                {p.cui_controlled && <StatusBadge tone="warn">CUI</StatusBadge>}
                {p.compliance_level && (
                  <StatusBadge tone="info">{p.compliance_level}</StatusBadge>
                )}
              </div>
              <div className="mt-auto pt-4">
                <Link
                  href={`/buyer/programs/${p.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300"
                >
                  Open program →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
