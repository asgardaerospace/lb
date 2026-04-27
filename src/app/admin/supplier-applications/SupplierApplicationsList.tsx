"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DataTable,
  StatusBadge,
  mapStatus,
  supplierApplicationStatusMap,
  type Column,
} from "@/components/ui";
import type {
  SupplierApplicationListRow,
  SupplierApplicationStatus,
} from "@/lib/supplier-application/types";
import type { StoredSupplierFitScore } from "@/lib/supplier-application/scoring-repository";
import {
  recommendationLabel,
  recommendationTone,
} from "@/lib/supplier-application/scoring";

type StatusFilter = "all" | SupplierApplicationStatus;
type ItarFilter = "all" | "yes" | "no";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "revisions_requested", label: "Revisions requested" },
  { value: "approved", label: "Approved" },
  { value: "converted", label: "Converted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const ITAR_FILTERS: { value: ItarFilter; label: string }[] = [
  { value: "all", label: "ITAR · any" },
  { value: "yes", label: "ITAR · yes" },
  { value: "no", label: "ITAR · no" },
];

export function SupplierApplicationsList({
  rows,
  previewMode,
  scores,
}: {
  rows: SupplierApplicationListRow[];
  previewMode: boolean;
  scores: Record<string, StoredSupplierFitScore>;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [itarFilter, setItarFilter] = useState<ItarFilter>("all");
  const [processFilter, setProcessFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const processOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      for (const p of r.primary_processes ?? []) set.add(p);
    }
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (itarFilter === "yes" && !r.itar_registered) return false;
      if (itarFilter === "no" && r.itar_registered) return false;
      if (processFilter !== "all") {
        if (!(r.primary_processes ?? []).includes(processFilter)) return false;
      }
      if (q) {
        const haystack = [r.legal_name, r.dba ?? ""].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, itarFilter, processFilter, query]);

  const columns: Column<SupplierApplicationListRow>[] = [
    {
      key: "company",
      header: "Company",
      render: (r) =>
        previewMode ? (
          <span className="text-slate-200">{r.legal_name}</span>
        ) : (
          <Link
            href={`/admin/supplier-applications/${r.id}`}
            className="text-cyan-300 transition hover:text-cyan-200"
          >
            {r.legal_name}
          </Link>
        ),
    },
    {
      key: "processes",
      header: "Primary processes",
      render: (r) =>
        (r.primary_processes ?? []).length === 0 ? (
          <span className="text-xs text-slate-600">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(r.primary_processes ?? []).slice(0, 3).map((p) => (
              <StatusBadge key={p} tone="info" dot={false}>
                {p}
              </StatusBadge>
            ))}
            {(r.primary_processes ?? []).length > 3 && (
              <span className="font-mono text-[10.5px] text-slate-500">
                +{(r.primary_processes ?? []).length - 3}
              </span>
            )}
          </div>
        ),
    },
    {
      key: "itar",
      header: "ITAR",
      render: (r) =>
        r.itar_registered ? (
          <StatusBadge tone="warn" dot={false}>
            Registered
          </StatusBadge>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        ),
    },
    {
      key: "location",
      header: "Location",
      render: (r) => (
        <span className="text-xs text-slate-400">
          {[r.hq_state, r.hq_country].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "score",
      header: "Readiness",
      align: "right",
      render: (r) => {
        const s = scores[r.id];
        if (!s) {
          return <span className="text-xs text-slate-600">— not scored</span>;
        }
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="font-mono text-sm tabular-nums text-slate-100">
              {s.composite_score}
            </span>
            <StatusBadge tone={recommendationTone(s.recommendation)} dot={false}>
              {recommendationLabel(s.recommendation)}
            </StatusBadge>
          </div>
        );
      },
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
          supplierApplicationStatusMap,
          r.status,
        );
        return <StatusBadge tone={tone}>{label}</StatusBadge>;
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-stretch gap-2 rounded-md border border-slate-800 bg-slate-900/40 p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex-1 min-w-[220px]">
          <label className="sr-only" htmlFor="sa-search">
            Search by company name
          </label>
          <input
            id="sa-search"
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
          onChange={(v) => setStatusFilter(v as StatusFilter)}
        />
        <FilterSelect
          label="Process"
          value={processFilter}
          options={processOptions.map((p) => ({
            value: p,
            label: p === "all" ? "All processes" : p,
          }))}
          onChange={(v) => setProcessFilter(v)}
        />
        <FilterSelect
          label="ITAR"
          value={itarFilter}
          options={ITAR_FILTERS}
          onChange={(v) => setItarFilter(v as ItarFilter)}
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
