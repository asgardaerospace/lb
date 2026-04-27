"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DataTable,
  StatusBadge,
  customerApplicationStatusMap,
  customerTierLabelMap,
  customerTierToneMap,
  mapStatus,
  type Column,
} from "@/components/ui";
import type {
  CustomerApplicationListRow,
  CustomerApplicationStatus,
  CustomerTier,
} from "@/lib/customer-application/types";

const STATUS_FILTERS: { value: "all" | CustomerApplicationStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "revisions_requested", label: "Revisions requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const TIER_FILTERS: { value: "all" | CustomerTier; label: string }[] = [
  { value: "all", label: "All tiers" },
  { value: "defense_prime", label: "Defense Prime" },
  { value: "itar_controlled", label: "ITAR-Controlled" },
  { value: "growth_stage", label: "Growth-Stage" },
  { value: "enterprise", label: "Enterprise" },
];

export function CustomerApplicationsList({
  rows,
  previewMode,
}: {
  rows: CustomerApplicationListRow[];
  previewMode: boolean;
}) {
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]["value"]>("all");
  const [tierFilter, setTierFilter] =
    useState<(typeof TIER_FILTERS)[number]["value"]>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (tierFilter !== "all" && r.derived_tier !== tierFilter) return false;
      if (q) {
        const haystack = [r.legal_name, r.dba ?? ""]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, tierFilter, query]);

  const columns: Column<CustomerApplicationListRow>[] = [
    {
      key: "company",
      header: "Company",
      render: (r) =>
        previewMode ? (
          <span className="text-slate-200">{r.legal_name}</span>
        ) : (
          <Link
            href={`/admin/customer-applications/${r.id}`}
            className="text-cyan-300 transition hover:text-cyan-200"
          >
            {r.legal_name}
          </Link>
        ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (r) => {
        if (!r.derived_tier) {
          return <span className="text-xs text-slate-500">—</span>;
        }
        const tone = customerTierToneMap[r.derived_tier] ?? "neutral";
        const label =
          customerTierLabelMap[r.derived_tier] ?? r.derived_tier;
        return (
          <StatusBadge tone={tone} dot={false}>
            {label}
          </StatusBadge>
        );
      },
    },
    {
      key: "org_type",
      header: "Org type",
      render: (r) => (
        <span className="text-slate-300 capitalize">
          {r.org_type ? r.org_type.replace("_", " ") : "—"}
        </span>
      ),
    },
    {
      key: "compliance",
      header: "Flags",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.itar && (
            <StatusBadge tone="warn" dot={false}>
              ITAR
            </StatusBadge>
          )}
          {r.defense_program && (
            <StatusBadge tone="accent" dot={false}>
              Defense
            </StatusBadge>
          )}
          {!r.itar && !r.defense_program && (
            <span className="text-xs text-slate-600">—</span>
          )}
        </div>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (r) => (
        <span className="text-xs text-slate-400">
          {r.submitted_at
            ? new Date(r.submitted_at).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const { label, tone } = mapStatus(
          customerApplicationStatusMap,
          r.status,
        );
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-stretch gap-2 rounded-md border border-slate-800 bg-slate-900/40 p-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="sr-only" htmlFor="ca-search">
            Search by company name
          </label>
          <input
            id="ca-search"
            type="search"
            placeholder="Search company or DBA…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-700 focus:outline-none"
          />
        </div>
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={STATUS_FILTERS}
          onChange={(v) =>
            setStatusFilter(v as (typeof STATUS_FILTERS)[number]["value"])
          }
        />
        <FilterSelect
          label="Tier"
          value={tierFilter}
          options={TIER_FILTERS}
          onChange={(v) =>
            setTierFilter(v as (typeof TIER_FILTERS)[number]["value"])
          }
        />
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 sm:ml-2">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        emptyTitle="No applications match"
        emptyBody="Adjust the filters or clear the search to see more rows."
        previewBanner={previewMode}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      <span className="font-mono uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-100 focus:border-cyan-700 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
