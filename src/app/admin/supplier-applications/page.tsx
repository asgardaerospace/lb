import { getOptionalUser } from "@/lib/auth";
import { listSupplierApplications } from "@/lib/supplier-application/repository";
import { PREVIEW_SUPPLIER_APPLICATIONS } from "@/lib/supplier-application/preview";
import type { SupplierApplicationListRow } from "@/lib/supplier-application/types";
import { PageHeader } from "@/components/shell/PageHeader";
import { KpiCard, KpiGrid, PreviewDataBanner } from "@/components/ui";
import { SupplierApplicationsList } from "./SupplierApplicationsList";

export const dynamic = "force-dynamic";

async function load(): Promise<SupplierApplicationListRow[] | null> {
  try {
    return await listSupplierApplications();
  } catch {
    return null;
  }
}

export default async function SupplierApplicationsPage() {
  const user = await getOptionalUser();
  const isAdmin = user?.role === "asgard_admin";
  const live = isAdmin ? await load() : null;
  const previewMode = !isAdmin || live === null;
  const rows = previewMode ? PREVIEW_SUPPLIER_APPLICATIONS : (live ?? []);

  const totals = {
    all: rows.length,
    submitted: rows.filter((r) => r.status === "submitted").length,
    underReview: rows.filter((r) => r.status === "under_review").length,
    needsAttention: rows.filter(
      (r) => r.status === "submitted" || r.status === "under_review",
    ).length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin · Supplier Intake"
        title="Supplier Applications"
        subtitle="Submitted supplier intake forms — triage, review, and decide on routing-pool admission."
      />

      {previewMode && (
        <PreviewDataBanner reason="No asgard_admin session — showing illustrative supplier-application rows." />
      )}

      <KpiGrid>
        <KpiCard label="Total" value={totals.all} accent="cyan" />
        <KpiCard label="Submitted" value={totals.submitted} accent="emerald" />
        <KpiCard label="Under Review" value={totals.underReview} accent="amber" />
        <KpiCard
          label="Needs Attention"
          value={totals.needsAttention}
          accent="cyan"
        />
      </KpiGrid>

      <SupplierApplicationsList rows={rows} previewMode={previewMode} />
    </>
  );
}
