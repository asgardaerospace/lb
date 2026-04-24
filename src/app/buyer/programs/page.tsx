import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { listProgramsForOrg } from "@/lib/rfq/repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Card,
  EmptyState,
  LinkButton,
  StatusBadge,
  PreviewDataBanner,
} from "@/components/ui";
import { PREVIEW_BUYER_PROGRAMS } from "@/lib/ui/mock";

export const dynamic = "force-dynamic";

type Program = {
  id: string;
  program_name: string;
  program_type: string | null;
  description: string | null;
  status: string;
  itar_controlled: boolean;
  cui_controlled: boolean;
  compliance_level: string | null;
};

async function loadPrograms(orgId: string): Promise<Program[] | null> {
  try {
    const data = await listProgramsForOrg(orgId);
    return data as Program[];
  } catch {
    return null;
  }
}

export default async function BuyerProgramsListPage() {
  const user = await getOptionalUser();
  const isBuyer = user?.role === "buyer_admin" || user?.role === "buyer_user";
  const live = isBuyer && user ? await loadPrograms(user.organization_id) : null;
  const previewMode = !isBuyer || live === null;
  const programs: Program[] = previewMode
    ? (PREVIEW_BUYER_PROGRAMS as unknown as Program[])
    : live!;

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

      {previewMode && (
        <PreviewDataBanner reason="No buyer session — showing illustrative programs." />
      )}

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
          {programs.map((p) => {
            const isPreview = p.id.startsWith("prog-prev-");
            return (
              <Card key={p.id} className="flex flex-col">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
                  {p.program_type ?? "Program"}
                </div>
                {isPreview ? (
                  <span className="text-base font-semibold text-slate-100">
                    {p.program_name}
                  </span>
                ) : (
                  <Link
                    href={`/buyer/programs/${p.id}`}
                    className="text-base font-semibold text-slate-100 transition hover:text-cyan-300"
                  >
                    {p.program_name}
                  </Link>
                )}
                <p className="mt-1 line-clamp-3 text-xs text-slate-400">
                  {p.description ?? "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <StatusBadge
                    tone={p.status === "active" ? "success" : "neutral"}
                  >
                    {p.status}
                  </StatusBadge>
                  {p.itar_controlled && (
                    <StatusBadge tone="warn">ITAR</StatusBadge>
                  )}
                  {p.cui_controlled && (
                    <StatusBadge tone="warn">CUI</StatusBadge>
                  )}
                  {p.compliance_level && (
                    <StatusBadge tone="info">{p.compliance_level}</StatusBadge>
                  )}
                </div>
                <div className="mt-auto pt-4">
                  {isPreview ? (
                    <span className="text-[10px] uppercase tracking-[0.22em] text-amber-300">
                      Preview only
                    </span>
                  ) : (
                    <Link
                      href={`/buyer/programs/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300"
                    >
                      Open program →
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
