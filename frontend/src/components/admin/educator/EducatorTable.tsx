"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, KeyRound } from "lucide-react";
import type { Educator } from "@/types/admin/educator.types";

interface EducatorTableProps {
  data:             Educator[];
  isLoading?:       boolean;
  onResetPassword:  (educator: Educator) => void;
}

export function EducatorTable({ data, isLoading, onResetPassword }: EducatorTableProps) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<Educator>[]>(() => [
    {
      id: "fullName",
      header: "Full Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.fullName}</span>
      ),
    },
    {
      id: "educatorCode",
      header: "Educator ID",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.educatorId ?? row.original.educatorCode}
        </Badge>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      id: "classCount",
      header: "Classes Assigned",
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">
          {row.original.classCount}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => router.push(`/admin/educators/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => onResetPassword(row.original)}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Reset Password
          </Button>
        </div>
      ),
    },
  ], [router, onResetPassword]);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle="No educators found"
      emptyDescription="Add your first educator to get started."
    />
  );
}