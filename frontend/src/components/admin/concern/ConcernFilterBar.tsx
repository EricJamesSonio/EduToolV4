// ===== File: frontend\src\components\admin\concern\ConcernFilterBar.tsx =====
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConcernCategoryItem } from "@/api/admin/concern.api";

const STATUS_OPTIONS = ["all", "open", "resolved"];
const SENDER_ROLE_OPTIONS = ["all", "student", "educator", "admin"];

export interface ConcernFilters {
  status: string;
  categoryId: string;
  senderRole: string;
}

interface ConcernFilterBarProps {
  filters: ConcernFilters;
  categories: ConcernCategoryItem[];
  categoriesLoading: boolean;
  onFilterChange: (key: keyof ConcernFilters, value: string) => void;
}

export function ConcernFilterBar({
  filters,
  categories,
  categoriesLoading,
  onFilterChange,
}: ConcernFilterBarProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.status}
        onValueChange={(v) => onFilterChange("status", v ?? "all")}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt === "all" ? "All Statuses" : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId}
        onValueChange={(v) => onFilterChange("categoryId", v ?? "all")}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All Categories">
                {categories.find((c) => c.id === filters.categoryId)?.label ?? "All Categories"}
              </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categoriesLoading ? (
            <SelectItem value="__loading__" disabled>
              Loading…
            </SelectItem>
          ) : (
            categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Select
        value={filters.senderRole}
        onValueChange={(v) => onFilterChange("senderRole", v ?? "all")}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Senders" />
        </SelectTrigger>
        <SelectContent>
          {SENDER_ROLE_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt === "all" ? "All Senders" : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}