"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, FileSpreadsheet, Trash2 } from "lucide-react";

import { DataTable } from "@/components/shared/DataTable";
import { RowActionButton, RowActions } from "@/components/shared/RowActions";
import type { GradeTemplateMeta } from "@/api/grade-template.api";

export function TemplateTable({
  data,
  isLoading,
  onView,
  onDownload,
  onDelete,
}: {
  data: GradeTemplateMeta[];
  isLoading?: boolean;
  onView: (t: GradeTemplateMeta) => void;
  onDownload: (t: GradeTemplateMeta) => void;
  onDelete: (t: GradeTemplateMeta) => void;
}): React.ReactElement {
  const columns = useMemo<ColumnDef<GradeTemplateMeta>[]>(
    () => [
      {
        id: "name",
        header: "Template",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">
                {row.original.fileName}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "department",
        header: "Department",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.programName ?? "All departments"}
          </span>
        ),
      },
      {
        id: "schoolYear",
        header: "School Year",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.schoolYearName}
          </span>
        ),
      },
      {
        id: "submitted",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.submissionCount} class(es)
          </span>
        ),
      },
      {
        id: "uploaded",
        header: "Uploaded",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <RowActions>
            <RowActionButton
              icon={Eye}
              label="View template"
              onClick={() => onView(row.original)}
            />
            <RowActionButton
              icon={Download}
              label="Download master"
              onClick={() => onDownload(row.original)}
            />
            <RowActionButton
              icon={Trash2}
              label="Delete template"
              destructive
              onClick={() => onDelete(row.original)}
            />
          </RowActions>
        ),
      },
    ],
    [onView, onDownload, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      onRowClick={onView}
      emptyTitle="No templates yet"
      emptyDescription="Add your CHED or DepEd workbook to get started."
    />
  );
}