import { getOptionalUser } from "@/lib/auth";
import { getIntakeDefaultsForOrganization } from "@/lib/customer-application/intake-defaults";
import ProgramCreateForm from "./ProgramCreateForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, PreviewDataBanner } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  const user = await getOptionalUser();
  const isBuyer = user?.role === "buyer_admin" || user?.role === "buyer_user";

  // Pre-fill defaults from the customer's onboarding intake when available.
  // Best-effort — null result just means no pre-fill happens.
  const defaults =
    isBuyer && user
      ? await getIntakeDefaultsForOrganization(user.organization_id)
      : null;

  return (
    <>
      <PageHeader
        eyebrow="Buyer · Program Submission"
        title="Submit Program"
        subtitle="Define a new aerospace program and establish system-level manufacturing context. The program becomes the parent container for RFQs, parts, and production activity."
        back={{ href: "/buyer/programs", label: "All programs" }}
      />
      {!isBuyer && (
        <PreviewDataBanner reason="No buyer session — form below renders for layout review but submissions will be rejected by the API." />
      )}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <ProgramCreateForm
            defaults={
              defaults
                ? {
                    program_name: defaults.suggested_program_name ?? "",
                    program_type: defaults.suggested_program_type ?? "",
                    lifecycle: defaults.suggested_lifecycle_stage ?? "",
                    itar: defaults.itar,
                    cui: defaults.cui,
                    cmmc_level: defaults.cmmc_level,
                    primary_processes: defaults.primary_processes,
                    legal_name: defaults.legal_name,
                  }
                : null
            }
          />
        </Card>
        <aside className="space-y-3">
          <Card>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
              What happens next
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="font-medium text-slate-300">
                  1 · Program created —
                </span>{" "}
                becomes the parent record for RFQs you submit.
              </li>
              <li>
                <span className="font-medium text-slate-300">
                  2 · Submit RFQs —
                </span>{" "}
                attach parts, quantities, and delivery requirements.
              </li>
              <li>
                <span className="font-medium text-slate-300">
                  3 · Asgard routes —
                </span>{" "}
                Launchbelt&apos;s routing console matches suppliers and
                requests quotes.
              </li>
              <li>
                <span className="font-medium text-slate-300">4 · Production —</span>{" "}
                accepted quotes become jobs with live progress tracking.
              </li>
            </ul>
          </Card>
          <Card>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400">
              Compliance reminder
            </div>
            <p className="text-xs text-slate-400">
              Mark ITAR / CUI controls accurately. These flags gate which
              suppliers the routing engine is allowed to consider.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
