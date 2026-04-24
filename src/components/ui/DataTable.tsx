import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  render: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyTitle?: string;
  emptyBody?: string;
  previewBanner?: boolean;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = "No records",
  emptyBody,
  previewBanner,
  dense,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  const cellPad = dense ? "px-3 py-2" : "px-4 py-2.5";
  const alignClass = (a?: "left" | "right" | "center") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
      {previewBanner && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          Preview data
        </div>
      )}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/70">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  className={`${cellPad} ${alignClass(c.align)} text-[11px] font-medium uppercase tracking-wider text-slate-500`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className="transition hover:bg-slate-800/40"
              >
                {columns.map((c) => (
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
    </div>
  );
}
