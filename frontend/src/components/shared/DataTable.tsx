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
import { useState, memo, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from "lucide-react";

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

function DataTableInner<TData, TValue>({
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

  const rows = table.getRowModel().rows;
  const isEmpty = rows.length === 0;

  return (
    <div className={cn("relative w-full", className)}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
          <LoadingSpinner size="md" />
        </div>
      )}

      <div className="rounded-md border bg-card">
        {/*
          Horizontal scroll instead of squishing columns: the table always
          uses auto layout (sized to its content) and never table-fixed,
          which previously caused text to visually spill into neighboring
          cells whenever any column declared a fixed size. Wide tables now
          scroll left/right within this container instead of colliding.
        */}
        <div className="overflow-x-auto rounded-md">
          <Table className="w-max min-w-full">
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
                        style={width !== undefined ? { width, minWidth: width } : undefined}
                        className={cn(
                          "whitespace-nowrap",
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

            {!isEmpty && (
              <TableBody>
                {rows.map((row) => (
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
                          style={width !== undefined ? { width, minWidth: width } : undefined}
                          className="whitespace-nowrap"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>

        {isEmpty && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 bg-card px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {emptyDescription}
            </p>
          </div>
        )}

        {isEmpty && isLoading && <div className="h-40 bg-card" />}
      </div>
    </div>
  );
}

export const DataTable = memo(DataTableInner) as <
  TData,
  TValue,
>(
  props: DataTableProps<TData, TValue>,
) => ReactElement;