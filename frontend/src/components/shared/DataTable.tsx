"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
  OnChangeFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onRowClick?: (row: TData) => void;
  className?: string;
  headerVariant?: "neutral" | "accent";
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "No results",
  emptyDescription = "There is nothing to display here yet.",
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  className,
  headerVariant = "neutral",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const hasFixedWidths = columns.some(
    (c) => c.size !== undefined || c.minSize !== undefined
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    autoResetPageIndex: false,
    state: {
      sorting,
      ...(rowSelection !== undefined ? { rowSelection } : {}),
    },
    ...(onRowSelectionChange ? { onRowSelectionChange } : {}),
    enableRowSelection: !!onRowSelectionChange,
  });

  return (
    <div className={cn("relative w-full", className)}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
          <LoadingSpinner size="md" />
        </div>
      )}

      <div className="rounded-md border">
        <Table className={cn(hasFixedWidths && "table-fixed")}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} data-header-variant={headerVariant}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const width =
                    header.column.columnDef.size !== undefined ||
                    header.column.columnDef.minSize !== undefined
                      ? header.column.getSize()
                      : undefined;
                  return (
                    <TableHead
                      key={header.id}
                      style={width !== undefined ? { width } : undefined}
                      className={cn(
                        canSort &&
                          "cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      )}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1.5">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span className="text-muted-foreground">
                              {sorted === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const width =
                      cell.column.columnDef.size !== undefined ||
                      cell.column.columnDef.minSize !== undefined
                        ? cell.column.getSize()
                        : undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        style={width !== undefined ? { width } : undefined}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="p-0 text-center border-0"
                  >
                    <div className="p-4">
                      <EmptyState
                        title={emptyTitle}
                        description={emptyDescription}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}