"use client";
import { SearchInput } from "@/components/shared/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GetStudentsQuery } from "@/api/admin/student.api";
import type { StudentStatus } from "@/types/admin/student.types";

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active",      label: "Active" },
  { value: "pending",     label: "Pending" },
  { value: "suspended",   label: "Suspended" },
  { value: "dropped",     label: "Dropped" },
  { value: "transferred", label: "Transferred" },
  { value: "graduated",   label: "Graduated" },
];

interface StudentFilterBarProps {
  filters: GetStudentsQuery;
  onChange: (filters: GetStudentsQuery) => void;
  levels: { id: string; name: string }[];
  sections: { id: string; name: string }[];
}

export function StudentFilterBar({
  filters,
  onChange,
  levels,
  sections,
}: StudentFilterBarProps): React.JSX.Element {
  function set(patch: Partial<GetStudentsQuery>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={filters.search ?? ""}
        onChange={(v) => set({ search: v || undefined })}
        placeholder="Search by name or student ID…"
        className="w-64"
      />

      <Select
        value={filters.status ?? "all"}
        onValueChange={(v) =>
          set({ status: v === "all" ? undefined : (v as StudentStatus) })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.levelId ?? "all"}
        onValueChange={(v) =>
          set({
            levelId: v === "all" ? undefined : v ?? "",
            sectionId: undefined, // reset dependent
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          {levels.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sectionId ?? "all"}
        onValueChange={(v) =>
          set({ sectionId: v === "all" ? undefined : v ?? ""})
        }
        disabled={!filters.levelId || sections.length === 0}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Sections" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sections</SelectItem>
          {sections.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}