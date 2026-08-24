"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ExcelColumn<T = any> {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  sticky?: boolean;
  render: (row: T, index: number) => ReactNode;
}

export function ExcelTable<T extends Record<string, any>>({
  columns,
  data,
}: {
  columns: ExcelColumn<T>[];
  data: T[];
}) {
  if (data.length === 0) return null;

  return (
    <div className="overflow-x-auto w-full">
      <table
        style={{
          borderCollapse: "collapse",
          tableLayout: "auto",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "bg-primary text-primary-foreground text-left text-[11px] font-semibold uppercase tracking-wide px-1.5 py-1 border-[0.5px] border-white/15 not-interactive",
                  col.sticky && "sticky left-0 z-10",
                )}
                style={{
                  width: col.width ?? col.minWidth ?? 80,
                  ...(col.sticky ? { left: 0 } : {}),
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id ?? idx}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-1.5 py-0.5 text-[11px] whitespace-nowrap border-[0.5px] border-muted/20 bg-white",
                    col.sticky && "sticky left-0 z-10 bg-white",
                    "hover:bg-info/10 cursor-default",
                  )}
                  style={col.sticky ? { left: 0 } : {}}
                >
                  {col.render(row, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
