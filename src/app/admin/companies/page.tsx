import { getOptionalUser } from "@/lib/auth";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Banner,
  DataTable,
  KpiCard,
  KpiGrid,
  StatusBadge,
  PreviewDataBanner,
  type Column,
} from "@/components/ui";
import { PREVIEW_COMPANIES } from "@/lib/ui/mock";
import {
  listOrganizationsForDirectory,
  type OrganizationDirectoryRow,
} from "@/lib/organizations/repository";
import { CompaniesTable } from "./CompaniesTable";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  const user = await getOptionalUser();

  if (user?.role !== "asgard_admin") {
    return <PreviewView />;
  }

  let organizations: OrganizationDirectoryRow[] = [];
  let loadError: string | null = null;
  try {
    organizations = await listOrganizationsForDirectory();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load directory";
  }

  const buyers = organizations.filter((o) => o.type === "buyer").length;
  const suppliers = organizations.filter((o) => o.type === "supplier").length;
  const itar = organizations.filter((o) => o.itar_registered).length;
  const approvedSuppliers = organizations.filter(
    (o) => o.type === "supplier" && o.supplier_approval_status === "approved",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Admin · Directory"
        title="Companies"
        subtitle="Buyers and suppliers registered on Launchbelt."
      />

      {loadError && (
        <div className="mb-4">
          <Banner tone="error" title="Could not load directory">
            {loadError}
          </Banner>
        </div>
      )}

      <KpiGrid>
        <KpiCard label="Total companies" value={organizations.length} accent="cyan" />
        <KpiCard label="Buyers" value={buyers} accent="emerald" />
        <KpiCard label="Suppliers" value={suppliers} accent="cyan" />
        <KpiCard label="Approved suppliers" value={approvedSuppliers} accent="emerald" />
        <KpiCard label="ITAR-registered" value={itar} accent="amber" />
      </KpiGrid>

      <CompaniesTable rows={organizations} />
    </>
  );
}

function PreviewView() {
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

      <PreviewDataBanner reason="Sign in as an Asgard admin to view the live directory. This screen is illustrative." />

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
