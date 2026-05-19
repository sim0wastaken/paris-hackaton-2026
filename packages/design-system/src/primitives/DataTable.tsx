"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../cn";

export interface DataTableColumn<Row> {
  id: string;
  header: React.ReactNode;
  cell: (row: Row, index: number) => React.ReactNode;
  /** Optional sort key. When provided, the header becomes clickable. */
  sortKey?: keyof Row | ((row: Row) => string | number);
  /** Column min width for desktop overflow planning. */
  minWidth?: number | string;
  align?: "start" | "center" | "end";
  /** Mobile card label (defaults to header). */
  mobileLabel?: React.ReactNode;
}

type SortDir = "asc" | "desc" | null;

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  /** Render the row as a mobile card (under container --cq-md). Falls back to a generic <dl>. */
  mobileCard?: (row: Row, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
  /** Optional row click handler. */
  onRowClick?: (row: Row) => void;
}

function compareVals(a: unknown, b: unknown) {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  mobileCard,
  emptyState,
  className,
  onRowClick,
}: DataTableProps<Row>) {
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>(null);

  const sortedRows = React.useMemo(() => {
    if (!sortCol || !sortDir) return rows;
    const col = columns.find((c) => c.id === sortCol);
    if (!col?.sortKey) return rows;
    const getKey = typeof col.sortKey === "function"
      ? col.sortKey
      : (row: Row) => row[col.sortKey as keyof Row] as unknown as string | number;
    const sign = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => sign * compareVals(getKey(a), getKey(b)));
  }, [rows, sortCol, sortDir, columns]);

  function toggleSort(id: string) {
    if (sortCol !== id) {
      setSortCol(id);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") return setSortDir("desc");
    if (sortDir === "desc") {
      setSortCol(null);
      setSortDir(null);
      return;
    }
    setSortDir("asc");
  }

  return (
    <div className={cn("motive-datatable", className)}>
      <div className="motive-datatable-scroll">
        <table className="motive-datatable-table">
          <thead>
            <tr>
              {columns.map((c) => {
                const sortable = !!c.sortKey;
                const active = sortCol === c.id;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    style={{ minWidth: c.minWidth, textAlign: c.align ?? "start" }}
                    data-sortable={sortable || undefined}
                    data-sorted={active ? sortDir ?? undefined : undefined}
                    aria-sort={
                      active && sortDir === "asc"
                        ? "ascending"
                        : active && sortDir === "desc"
                          ? "descending"
                          : "none"
                    }
                  >
                    {sortable ? (
                      <button type="button" onClick={() => toggleSort(c.id)} className="motive-datatable-sort">
                        {c.header}
                        <span aria-hidden="true" className="motive-datatable-sort-icon">
                          {active && sortDir === "desc" ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronUp size={12} style={{ opacity: active ? 1 : 0.4 }} />
                          )}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="motive-datatable-empty">
                  {emptyState ?? <span className="t-caption">No results.</span>}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  data-clickable={onRowClick ? "" : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.id} style={{ textAlign: c.align ?? "start" }}>
                      {c.cell(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="motive-datatable-cards" role="list">
        {sortedRows.length === 0 ? (
          <div className="motive-datatable-empty-card">
            {emptyState ?? <span className="t-caption">No results.</span>}
          </div>
        ) : (
          sortedRows.map((row, index) => (
            <div
              key={rowKey(row, index)}
              role="listitem"
              className={cn("motive-datatable-card", onRowClick && "motive-datatable-card-clickable")}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {mobileCard ? (
                mobileCard(row, index)
              ) : (
                <dl className="motive-datatable-dl">
                  {columns.map((c) => (
                    <div key={c.id} className="motive-datatable-dl-row">
                      <dt>{c.mobileLabel ?? c.header}</dt>
                      <dd>{c.cell(row, index)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
DataTable.displayName = "DataTable";
