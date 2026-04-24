import { getOptionalUser } from "@/lib/auth";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DataTable,
  KpiCard,
  KpiGrid,
  StatusBadge,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { PREVIEW_COMPANIES } from "@/lib/ui/mock";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  // UI preview surface — no backend data is loaded. Resolve the user
  // optionally so the page renders cleanly on environments without a
  // Supabase session or env vars.
  await getOptionalUser();

  type Row = (typeof PREVIEW_COMPANIES)[number];

  const buyers = PREVIEW_COMPANIES.filter((c) => c.type === "buyer").length;
  const suppliers = PREVIEW_COMPANIES.filter(
    (c) => c.type === "supplier",
  ).length;
  const itar = PREVIEW_COMPANIES.filter((c) => c.itar).length;

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Organization",
      render: (r) => <span className="font-medium text-slate-100">{r.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <StatusBadge tone={r.type === "buyer" ? "info" : "accent"}>
          {r.type}
        </StatusBadge>
      ),
    },
    {
      key: "programs",
      header: "Programs",
      align: "right",
      render: (r) => <span className="tabular-nums text-slate-400">{r.programs}</span>,
    },
    {
      key: "rfqs",
      header: "RFQs",
      align: "right",
      render: (r) => <span className="tabular-nums text-slate-400">{r.rfqs}</span>,
    },
    {
      key: "itar",
      header: "ITAR",
      render: (r) =>
        r.itar ? (
          <StatusBadge tone="warn" dot={false}>
            ITAR
          </StatusBadge>
        ) : (
          <span className="text-slate-600">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Directory"
        title="Companies"
        subtitle="Buyers and suppliers registered on Launchbelt."
      />

      <PreviewDataBanner reason="Directory is a UI preview — no organizations endpoint is wired yet. Production data will populate once the endpoint ships." />

      <KpiGrid>
        <KpiCard label="Total companies" value={PREVIEW_COMPANIES.length} accent="cyan" />
        <KpiCard label="Buyers" value={buyers} accent="emerald" />
        <KpiCard label="Suppliers" value={suppliers} accent="cyan" />
        <KpiCard label="ITAR-registered" value={itar} accent="amber" />
      </KpiGrid>

      <DataTable
        columns={columns}
        rows={PREVIEW_COMPANIES as unknown as Row[]}
        rowKey={(r) => r.name}
        previewBanner
      />
    </>
  );
}
