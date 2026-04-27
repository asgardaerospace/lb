import { getOptionalUser } from "@/lib/auth";
import { listCustomerApplications } from "@/lib/customer-application/repository";
import {
  PREVIEW_CUSTOMER_APPLICATIONS,
  PREVIEW_CUSTOMER_APPLICATION_SCORES,
} from "@/lib/customer-application/preview";
import { getLatestFitScoresForApplications } from "@/lib/customer-application/scoring-repository";
import type { CustomerApplicationListRow } from "@/lib/customer-application/types";
import type { StoredFitScore } from "@/lib/customer-application/scoring-repository";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  KpiCard,
  KpiGrid,
  PreviewDataBanner,
} from "@/components/ui";
import { CustomerApplicationsList } from "./CustomerApplicationsList";

export const dynamic = "force-dynamic";

async function load(): Promise<CustomerApplicationListRow[] | null> {
  try {
    return await listCustomerApplications();
  } catch {
    return null;
  }
}

async function loadScores(
  applicationIds: string[],
): Promise<Map<string, StoredFitScore> | null> {
  try {
    return await getLatestFitScoresForApplications(applicationIds);
  } catch {
    return null;
  }
}

export default async function CustomerApplicationsPage() {
  const user = await getOptionalUser();
  const isAdmin = user?.role === "asgard_admin";
  const live = isAdmin ? await load() : null;
  const previewMode = !isAdmin || live === null;
  const rows = previewMode ? PREVIEW_CUSTOMER_APPLICATIONS : (live ?? []);

  const scores: Map<string, StoredFitScore> = previewMode
    ? PREVIEW_CUSTOMER_APPLICATION_SCORES
    : (await loadScores(rows.map((r) => r.id))) ?? new Map();

  const totals = {
    all: rows.length,
    submitted: rows.filter((r) => r.status === "submitted").length,
    underReview: rows.filter((r) => r.status === "under_review").length,
    needsAttention: rows.filter(
      (r) =>
        r.status === "submitted" || r.status === "under_review",
    ).length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin · Intake"
        title="Customer Applications"
        subtitle="Submitted customer onboarding intakes — triage, review, and decide."
      />

      {previewMode && (
        <PreviewDataBanner reason="No asgard_admin session — showing illustrative customer-application rows." />
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

      <CustomerApplicationsList
        rows={rows}
        previewMode={previewMode}
        scores={Object.fromEntries(scores)}
      />
    </>
  );
}
