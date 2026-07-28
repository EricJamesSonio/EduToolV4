// ===== File: frontend/src/components/admin/grading-scheme-template/ClassesTable.tsx =====
"use client";

import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";

interface ClassRow {
  id: string;
  name: string;
  className: string;
  programName: string;
  programId: string;
}

interface ClassesTableProps {
  classes: ClassRow[];
  templates: GradingSchemeTemplate[];
  isLoading: boolean;
  onApplyTemplate: (classId: string, className: string) => void;
}

export function ClassesTable({
  classes,
  templates,
  isLoading,
  onApplyTemplate,
}: ClassesTableProps): React.JSX.Element {
  const columns = [
    {
      accessorKey: "name",
      header: "Class",
      size: 300,
    },
    {
      accessorKey: "programName",
      header: "Program",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onApplyTemplate(row.original.id, row.original.name)
            }
            disabled={templates.length === 0}
          >
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            Apply Template
          </Button>
        </div>
      ),
    },
  ];

  if (classes.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground not-interactive">
          No classes found for this school year. Create classes first.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <DataTable
        columns={columns}
        data={classes}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No classes exist for this school year. Create classes first before applying templates."
      />
    </div>
  );
}