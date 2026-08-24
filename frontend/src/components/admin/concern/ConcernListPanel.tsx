// ===== File: frontend\src\components\admin\concern\ConcernListPanel.tsx =====
"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";

import type { StaffConcernRow } from "@/api/admin/concern.api";

interface ConcernListPanelProps {
  columns: ColumnDef<StaffConcernRow>[];
  rows: StaffConcernRow[];
  isLoading: boolean;
  page: number;
  limit: number;
  total: number;
  onRowSelect: (id: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function ConcernListPanel({
  columns,
  rows,
  isLoading,
  page,
  limit,
  total,
  onRowSelect,
  onPageChange,
  onLimitChange,
}: ConcernListPanelProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        emptyTitle="No concerns found"
        emptyDescription="Adjust your filters or wait for students to submit concerns."
        onRowClick={(row) => onRowSelect(row.id)}
      />
      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        pageSizeOptions={[20, 50, 100]}
      />
    </div>
  );
}