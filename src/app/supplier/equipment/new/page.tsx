import { getOptionalUser } from "@/lib/auth";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, PreviewDataBanner, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AddEquipmentPage() {
  await getOptionalUser();

  return (
    <>
      <PageHeader
        eyebrow="Supplier · Capability"
        title="Add Equipment"
        subtitle="Declare a new machine in your capability envelope."
      />

      <PreviewDataBanner reason="This form is UI-only. The machines endpoint is not yet wired — submissions will not persist." />

      <Card>
        <form className="space-y-5" action={undefined}>
          <Field label="Machine type" required>
            <input
              disabled
              placeholder="e.g. 5-Axis CNC Mill"
              className="w-full rounded-md border px-3 py-2 opacity-60"
            />
          </Field>
          <Field label="Materials supported">
            <input
              disabled
              placeholder="Aluminum, Titanium, Stainless"
              className="w-full rounded-md border px-3 py-2 opacity-60"
            />
          </Field>
          <Field label="Capacity">
            <input
              disabled
              placeholder="e.g. 2 machines · 80 hrs/wk"
              className="w-full rounded-md border px-3 py-2 opacity-60"
            />
          </Field>
          <Field label="Notes">
            <textarea
              disabled
              rows={3}
              placeholder="Setup constraints, tooling, envelope, etc."
              className="w-full rounded-md border px-3 py-2 opacity-60"
            />
          </Field>
          <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
            <LinkButton href="/supplier/equipment" variant="ghost" size="sm">
              Cancel
            </LinkButton>
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center rounded-md bg-cyan-500 px-3.5 py-2 text-sm font-medium text-slate-950 opacity-50"
            >
              Save (disabled — endpoint pending)
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {required && <span className="text-rose-400">*</span>}
      </div>
      {children}
    </label>
  );
}
