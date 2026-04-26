"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "./EmptyState";
import type { Column } from "./DataTable";

/**
 * Client-side DataTable with sort / filter / search / column-visibility.
 *
 * RSC note: column `render`/accessor functions are not serializable across
 * the Server→Client boundary, so this component must be used inside a
 * "use client" file (page or wrapper). The plain `<DataTable>` remains
 * available for non-interactive, server-rendered tables.
 */

export interface ColumnFilter<T> {
  options: { label: string; value: string }[];
  accessor: (row: T) => string | null | undefined;
  placeholder?: string;
}

export interface InteractiveColumn<T> extends Column<T> {
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | Date | null | undefined;
  searchAccessor?: (row: T) => string | null | undefined;
  filter?: ColumnFilter<T>;
  /** Start hidden — user can re-enable from the columns dropdown. */
  defaultHidden?: boolean;
  /** Hide from the columns dropdown entirely; column always rendered. */
  alwaysVisible?: boolean;
}

interface InteractiveDataTableProps<T> {
  columns: InteractiveColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: React.ReactNode;
  previewBanner?: boolean;
  dense?: boolean;

  searchable?: boolean;
  searchPlaceholder?: string;
  enableColumnVisibility?: boolean;
  /** When set, paginate to this many rows per page. */
  pageSize?: number;
  /**
   * When true, syncs search / sort / filters / page / hidden-columns to the
   * URL search params so reloads + back-button preserve table state.
   * Multiple `<InteractiveDataTable urlSync>` on the same page would collide;
   * keep at most one per route, or pass a string namespace via `urlKey`.
   */
  urlSync?: boolean;
  /** Optional namespace prefix for URL params (e.g. "co" → ?co_q=…). */
  urlKey?: string;
}

type SortDir = "asc" | "desc";
type SortState = { key: string; dir: SortDir } | null;

function fallback<T>(row: T, key: string): unknown {
  return (row as unknown as Record<string, unknown>)[key];
}

function compare(a: unknown, b: unknown): number {
  const aNull = a === null || a === undefined || a === "";
  const bNull = b === null || b === undefined || b === "";
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  if (a instanceof Date || b instanceof Date) {
    const at = a instanceof Date ? a.getTime() : new Date(a as string).getTime();
    const bt = b instanceof Date ? b.getTime() : new Date(b as string).getTime();
    return at - bt;
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

export function InteractiveDataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = "No records",
  emptyBody,
  emptyAction,
  previewBanner,
  dense,
  searchable,
  searchPlaceholder = "Search…",
  enableColumnVisibility,
  pageSize,
  urlSync,
  urlKey,
}: InteractiveDataTableProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ns = urlKey ? `${urlKey}_` : "";
  const paramKey = (k: string) => `${ns}${k}`;
  const filterColumns = columns.filter((c) => c.filter);
  const hasDefaultHidden = columns.some((c) => c.defaultHidden);
  const showColumnsControl =
    Boolean(enableColumnVisibility) || hasDefaultHidden;
  const showToolbar = Boolean(
    searchable || filterColumns.length > 0 || showColumnsControl,
  );

  // Lazy-initialize from URL when urlSync is on. useSearchParams works on
  // both SSR + CSR, so reading it inside the initializer avoids the
  // hydrate-via-effect anti-pattern.
  const [query, setQuery] = useState(() =>
    urlSync ? (searchParams.get(paramKey("q")) ?? "") : "",
  );
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    if (!urlSync) return {};
    const init: Record<string, string> = {};
    for (const c of columns) {
      if (!c.filter) continue;
      const v = searchParams.get(paramKey(`f_${c.key}`));
      if (v) init[c.key] = v;
    }
    return init;
  });
  const [sort, setSort] = useState<SortState>(() => {
    if (!urlSync) return null;
    const raw = searchParams.get(paramKey("sort"));
    if (!raw) return null;
    const [k, dir] = raw.split(":");
    return k && (dir === "asc" || dir === "desc") ? { key: k, dir } : null;
  });
  const [page, setPage] = useState(() => {
    if (!urlSync) return 1;
    const raw = searchParams.get(paramKey("page"));
    const n = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n >= 1 ? n : 1;
  });
  const [hidden, setHidden] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const c of columns) {
      if (c.defaultHidden) init[c.key] = true;
    }
    if (urlSync) {
      const raw = searchParams.get(paramKey("hide"));
      if (raw) {
        for (const k of raw.split(",").filter(Boolean)) init[k] = true;
      }
    }
    return init;
  });
  const [colsOpen, setColsOpen] = useState(false);
  const colsRef = useRef<HTMLDivElement | null>(null);

  // Push state to URL when it changes (replace, so we don't pile history).
  useEffect(() => {
    if (!urlSync) return;
    const params = new URLSearchParams(searchParams.toString());
    const set = (k: string, v: string | null) => {
      const key = paramKey(k);
      if (v && v.length > 0) params.set(key, v);
      else params.delete(key);
    };

    set("q", query.trim() || null);
    set("sort", sort ? `${sort.key}:${sort.dir}` : null);
    set("page", page > 1 ? String(page) : null);

    for (const c of columns) {
      if (!c.filter) continue;
      set(`f_${c.key}`, filters[c.key] ?? null);
    }
    const hiddenKeys = Object.entries(hidden)
      .filter(([, v]) => v)
      .map(([k]) => k);
    set("hide", hiddenKeys.length > 0 ? hiddenKeys.join(",") : null);

    const next = params.toString();
    const target = next ? `${pathname}?${next}` : pathname;
    router.replace(target, { scroll: false });
    // searchParams object identity changes per render — we read it imperatively
    // here. The state values in the dep array are what actually matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, filters, hidden, page, urlSync, pathname]);

  useEffect(() => {
    if (!colsOpen) return;
    function onClick(e: MouseEvent) {
      if (!colsRef.current) return;
      if (!colsRef.current.contains(e.target as Node)) {
        setColsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [colsOpen]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hidden[c.key]),
    [columns, hidden],
  );

  const processedRows = useMemo(() => {
    let out = rows;

    const q = query.trim().toLowerCase();
    if (searchable && q) {
      out = out.filter((row) =>
        columns.some((c) => {
          const v = c.searchAccessor
            ? c.searchAccessor(row)
            : fallback(row, c.key);
          if (v === null || v === undefined) return false;
          return String(v).toLowerCase().includes(q);
        }),
      );
    }

    for (const c of columns) {
      if (!c.filter) continue;
      const active = filters[c.key];
      if (!active) continue;
      out = out.filter((row) => {
        const v = c.filter!.accessor(row);
        return v != null && String(v) === active;
      });
    }

    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        const acc =
          col.sortAccessor ??
          ((row: T) =>
            fallback(row, col.key) as
              | string
              | number
              | Date
              | null
              | undefined);
        const sorted = [...out].sort((a, b) => compare(acc(a), acc(b)));
        if (sort.dir === "desc") sorted.reverse();
        out = sorted;
      }
    }

    return out;
  }, [rows, columns, query, filters, sort, searchable]);

  // Page reset is handled inline at every state-change site (search box,
  // filter selects, sort toggle, reset button) rather than via a watching
  // effect. That avoids a setState-in-effect cascade.

  const totalPages = pageSize
    ? Math.max(1, Math.ceil(processedRows.length / pageSize))
    : 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = pageSize
    ? processedRows.slice((safePage - 1) * pageSize, safePage * pageSize)
    : processedRows;

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
    setPage(1);
  }

  const cellPad = dense ? "px-3 py-2" : "px-4 py-2.5";
  const alignClass = (a?: "left" | "right" | "center") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  const visibleCount = visibleColumns.length;
  const hiddenCount = columns.length - visibleCount;
  const hasActiveControls =
    Boolean(query) || Object.values(filters).some(Boolean) || sort !== null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
      {previewBanner && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          Preview data
        </div>
      )}

      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-3 py-2">
          {searchable && (
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-56 rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
            />
          )}

          {filterColumns.map((c) => (
            <label key={c.key} className="flex items-center gap-1.5 text-[11px]">
              <span className="uppercase tracking-[0.18em] text-slate-500">
                {typeof c.header === "string" ? c.header : c.key}
              </span>
              <select
                value={filters[c.key] ?? ""}
                onChange={(e) => {
                  setFilters((prev) => {
                    const next = { ...prev };
                    if (e.target.value) next[c.key] = e.target.value;
                    else delete next[c.key];
                    return next;
                  });
                  setPage(1);
                }}
                className="rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1 text-xs text-slate-200 focus:border-cyan-500/50 focus:outline-none"
              >
                <option value="">{c.filter!.placeholder ?? "All"}</option>
                {c.filter!.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}

          {hasActiveControls && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilters({});
                setSort(null);
                setPage(1);
              }}
              className="text-[11px] text-slate-400 transition hover:text-slate-200"
            >
              Reset
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500">
            <span>
              {processedRows.length}
              {processedRows.length !== rows.length ? ` / ${rows.length}` : ""}{" "}
              rows
            </span>
            {showColumnsControl && (
              <div ref={colsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setColsOpen((v) => !v)}
                  className="rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300 transition hover:border-slate-700 hover:text-slate-100"
                >
                  Columns
                  {hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}
                </button>
                {colsOpen && (
                  <div className="absolute right-0 top-8 z-30 w-56 rounded-md border border-slate-800 bg-slate-950/95 p-1 shadow-2xl">
                    {columns.map((c) => {
                      const isHidden = !!hidden[c.key];
                      const isLocked = c.alwaysVisible;
                      return (
                        <label
                          key={c.key}
                          className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs ${
                            isLocked
                              ? "text-slate-600"
                              : "text-slate-200 hover:bg-slate-900"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!isHidden}
                            disabled={isLocked}
                            onChange={(e) => {
                              setHidden((prev) => ({
                                ...prev,
                                [c.key]: !e.target.checked,
                              }));
                            }}
                            className="h-3.5 w-3.5 accent-cyan-400"
                          />
                          <span className="truncate">
                            {typeof c.header === "string" ? c.header : c.key}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {processedRows.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState
            title={emptyTitle}
            body={emptyBody}
            action={emptyAction}
          />
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70">
                {visibleColumns.map((c) => {
                  const sortActive = sort?.key === c.key;
                  const arrow = !sortActive
                    ? ""
                    : sort.dir === "asc"
                      ? "▲"
                      : "▼";
                  const headerInner = c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={`inline-flex items-center gap-1 transition hover:text-slate-200 ${
                        sortActive ? "text-slate-200" : ""
                      }`}
                    >
                      <span>{c.header}</span>
                      <span className="text-[10px] opacity-70">{arrow}</span>
                    </button>
                  ) : (
                    c.header
                  );
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      style={c.width ? { width: c.width } : undefined}
                      className={`${cellPad} ${alignClass(c.align)} text-[11px] font-medium uppercase tracking-wider text-slate-500`}
                    >
                      {headerInner}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {pageRows.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  className="transition hover:bg-slate-800/40"
                >
                  {visibleColumns.map((c) => (
                    <td
                      key={c.key}
                      className={`${cellPad} ${alignClass(c.align)} align-middle text-slate-300`}
                    >
                      {c.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageSize && processedRows.length > pageSize && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-400">
          <span>
            Page {safePage} of {totalPages} · {processedRows.length} rows
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              className="rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1 text-slate-300 transition hover:border-slate-700 hover:text-slate-100 disabled:opacity-40"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1 text-slate-300 transition hover:border-slate-700 hover:text-slate-100 disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1 text-slate-300 transition hover:border-slate-700 hover:text-slate-100 disabled:opacity-40"
            >
              →
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              className="rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1 text-slate-300 transition hover:border-slate-700 hover:text-slate-100 disabled:opacity-40"
            >
              ⏭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
