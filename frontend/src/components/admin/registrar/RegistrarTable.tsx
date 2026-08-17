"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyRound, UserCheck, UserCog } from "lucide-react";
import type { Registrar } from "@/types/admin/registrar.types";

interface RegistrarTableProps {
  data:            Registrar[];
  isLoading?:      boolean;
  onResetPassword: (registrar: Registrar) => void;
  onToggleStatus?: (registrar: Registrar) => void;
  allowSuspend?:   boolean;
}

export function RegistrarTable({
  data,
  isLoading,
  onResetPassword,
  onToggleStatus,
  allowSuspend = true,
}: RegistrarTableProps) {
  const columns = useMemo<ColumnDef<Registrar>[]>(() => [
    {
      id: "fullName",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.fullName ?? row.original.username}</span>
      ),
    },
    {
      id: "username",
      header: "Username",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.username}</span>
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
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "secondary" : "destructive"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
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
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => onResetPassword(row.original)}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Reset Password
          </Button>
          {allowSuspend && onToggleStatus && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => onToggleStatus(row.original)}
            >
              {row.original.status === "active"
                ? (<><UserCheck className="h-3.5 w-3.5" />Suspend</>)
                : (<><UserCog className="h-3.5 w-3.5" />Activate</>)}
            </Button>
          )}
        </div>
      ),
    },
  ], [onResetPassword, onToggleStatus, allowSuspend]);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle="No registrars found"
      emptyDescription="Add your first registrar to get started."
    />
  );
}