import { Logo } from "@/components/shell/Logo";
import { SupplierApplicationForm } from "./SupplierApplicationForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Launchbelt — Supplier Application",
};

export default function SupplierApplyPage() {
  return (
    <main
      className="min-h-screen px-4 py-10 text-slate-200 sm:px-8"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(34,211,238,0.05), transparent 55%), #03060c",
      }}
    >
      <div className="mx-auto max-w-[1080px]">
        <header className="mb-8">
          <Logo />
          <div className="mt-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-cyan-400">
              Supplier intake
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
              Apply to the Launchbelt supplier network
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Tell us about your shop, capabilities, and certifications.
              Asgard reviews each application against the active customer
              demand pipeline before approval. Drafts persist in your
              browser as you type — leave and come back any time.
            </p>
          </div>
        </header>

        <SupplierApplicationForm />

        <p className="mt-10 text-[11px] text-slate-600">
          Phase 2 supplier intake — wired to <code>/api/supplier-applications</code>.
          The full multi-section design from the supplier application bundle
          is the next iteration; this scaffold exercises every supplier
          intake table (parent + certifications + machines + capabilities +
          past_performance) end-to-end.
        </p>
      </div>
    </main>
  );
}
