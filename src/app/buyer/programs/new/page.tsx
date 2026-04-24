import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth";
import ProgramCreateForm from "./ProgramCreateForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  try {
    await requireRole(["buyer_admin", "buyer_user"]);
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/");
    throw err;
  }

  return (
    <>
      <PageHeader
        eyebrow="Buyer · Program Submission"
        title="Submit Program"
        subtitle="Define a new aerospace program and establish system-level manufacturing context. The program becomes the parent container for RFQs, parts, and production activity."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <ProgramCreateForm />
        </Card>
        <aside className="space-y-3">
          <Card>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
              What happens next
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="font-medium text-slate-300">1 · Program created —</span>{" "}
                becomes the parent record for RFQs you submit.
              </li>
              <li>
                <span className="font-medium text-slate-300">2 · Submit RFQs —</span>{" "}
                attach parts, quantities, and delivery requirements.
              </li>
              <li>
                <span className="font-medium text-slate-300">3 · Asgard routes —</span>{" "}
                Launchbelt&apos;s routing console matches suppliers and requests quotes.
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
              Mark ITAR / CUI controls accurately. These flags gate which suppliers the routing engine is allowed to consider.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
