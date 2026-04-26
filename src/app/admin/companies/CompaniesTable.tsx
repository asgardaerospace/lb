"use client";

import {
  InteractiveDataTable,
  StatusBadge,
  mapStatus,
  supplierStatusMap,
  type InteractiveColumn,
} from "@/components/ui";
import type { OrganizationDirectoryRow } from "@/lib/organizations/repository";

interface Props {
  rows: OrganizationDirectoryRow[];
}

export function CompaniesTable({ rows }: Props) {
  const columns: InteractiveColumn<OrganizationDirectoryRow>[] = [
    {
      key: "name",
      header: "Organization",
      sortable: true,
      sortAccessor: (r) => r.name.toLowerCase(),
      searchAccessor: (r) => r.name,
      render: (r) => (
        <div>
          <div className="font-medium text-slate-100">{r.name}</div>
          <div className="text-[11px] text-slate-500">
            {r.user_count} {r.user_count === 1 ? "user" : "users"}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      sortAccessor: (r) => r.type,
      filter: {
        accessor: (r) => r.type,
        options: [
          { value: "buyer", label: "Buyer" },
          { value: "supplier", label: "Supplier" },
          { value: "asgard", label: "Asgard" },
        ],
        placeholder: "All types",
      },
      render: (r) => (
        <StatusBadge
          tone={
            r.type === "buyer"
              ? "info"
              : r.type === "supplier"
                ? "accent"
                : "neutral"
          }
        >
          {r.type}
        </StatusBadge>
      ),
    },
    {
      key: "cert",
      header: "Certification",
      sortable: true,
      sortAccessor: (r) => r.supplier_approval_status ?? "zzz",
      searchAccessor: (r) =>
        [
          r.supplier_approval_status,
          r.as9100_certified ? "AS9100" : "",
          r.iso9001_certified ? "ISO9001" : "",
          r.cmmc_status,
        ]
          .filter(Boolean)
          .join(" "),
      filter: {
        accessor: (r) =>
          r.type === "supplier" ? (r.supplier_approval_status ?? "none") : null,
        options: [
          { value: "approved", label: "Approved" },
          { value: "submitted", label: "Submitted" },
          { value: "under_review", label: "Under review" },
          { value: "revisions_requested", label: "Revisions requested" },
          { value: "draft", label: "Draft" },
          { value: "rejected", label: "Rejected" },
          { value: "none", label: "No profile" },
        ],
        placeholder: "Any status",
      },
      render: (r) => {
        if (r.type !== "supplier")
          return <span className="text-slate-600">—</span>;
        const { label, tone } = mapStatus(
          supplierStatusMap,
          r.supplier_approval_status,
        );
        const flags: string[] = [];
        if (r.as9100_certified) flags.push("AS9100");
        if (r.iso9001_certified) flags.push("ISO9001");
        if (r.cmmc_status && r.cmmc_status !== "none") {
          flags.push(r.cmmc_status.toUpperCase().replace("LEVEL_", "L"));
        }
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge tone={tone}>{label}</StatusBadge>
            {flags.length > 0 && (
              <span className="text-[11px] text-slate-500">
                {flags.join(" · ")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "activity",
      header: "Activity",
      sortable: true,
      sortAccessor: (r) =>
        r.type === "supplier"
          ? r.jobs_count
          : r.type === "buyer"
            ? r.programs_count
            : 0,
      defaultHidden: false,
      render: (r) => {
        if (r.type === "supplier") {
          return (
            <span className="text-xs text-slate-400">
              {r.jobs_count} {r.jobs_count === 1 ? "job" : "jobs"}
            </span>
          );
        }
        if (r.type === "buyer") {
          return (
            <span className="text-xs text-slate-400">
              {r.programs_count}{" "}
              {r.programs_count === 1 ? "program" : "programs"}
              {" · "}
              {r.rfqs_count} {r.rfqs_count === 1 ? "RFQ" : "RFQs"}
            </span>
          );
        }
        return <span className="text-slate-600">—</span>;
      },
    },
    {
      key: "itar",
      header: "ITAR",
      sortable: true,
      sortAccessor: (r) => (r.itar_registered ? 1 : 0),
      filter: {
        accessor: (r) => (r.itar_registered ? "yes" : "no"),
        options: [
          { value: "yes", label: "ITAR" },
          { value: "no", label: "Non-ITAR" },
        ],
        placeholder: "ITAR · all",
      },
      render: (r) =>
        r.itar_registered ? (
          <StatusBadge tone="warn" dot={false}>
            ITAR
          </StatusBadge>
        ) : (
          <span className="text-slate-600">—</span>
        ),
    },
    {
      key: "created",
      header: "Joined",
      sortable: true,
      sortAccessor: (r) => r.created_at,
      defaultHidden: true,
      render: (r) => (
        <span className="text-xs text-slate-500">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <InteractiveDataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      searchable
      searchPlaceholder="Search organizations…"
      enableColumnVisibility
      pageSize={25}
      urlSync
      emptyTitle="No organizations match these filters"
      emptyBody="Adjust the search, type, or status filter — or reset above."
    />
  );
}
