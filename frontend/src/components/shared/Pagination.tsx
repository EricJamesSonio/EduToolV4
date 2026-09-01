"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 25, 50],
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

const getPageNumbers = () => {
  let start = page - 1;
  let end = page + 1;

  if (start < 1) {
    end += 1 - start;
    start = 1;
  }
  if (end > totalPages) {
    start -= end - totalPages;
    end = totalPages;
  }
  start = Math.max(1, start);
  end = Math.min(totalPages, end);

  const range: number[] = [];
  for (let i = start; i <= end; i++) range.push(i);

  return range;
};

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Result count */}
      <p className="text-sm text-muted-foreground not-interactive">
        {total === 0 ? (
          "No results"
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-foreground">
              {from}–{to}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{total}</span>{" "}
            result{total !== 1 ? "s" : ""}
          </>
        )}
      </p>

      <div className="flex items-center gap-4">
        {/* Page size selector */}
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap not-interactive">
              Rows per page
            </span>
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                onLimitChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

{getPageNumbers().map((p) => (
  <Button
    key={p}
    variant={p === page ? "default" : "outline"}
    size="icon"
    className="h-8 w-8 text-sm"
    onClick={() => onPageChange(p)}
  >
    {p}
  </Button>
))}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}