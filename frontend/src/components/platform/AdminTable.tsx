"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/date.util";
import { Eye, KeyRound, ShieldOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { AdminAccount } from "@/types/platform.types";

interface AdminTableProps {
  data: AdminAccount[];
  isLoading: boolean;
  onResetPassword: (admin: AdminAccount) => void;
  onBlock: (admin: AdminAccount) => void;
  onUnblock: (admin: AdminAccount) => void;
}

export function AdminTable({
  data,
  isLoading,
  onResetPassword,
  onBlock,
  onUnblock,
}: AdminTableProps) {
  const columns: ColumnDef<AdminAccount>[] = [
    {
      accessorKey: "fullName",
      header: "Full Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.fullName ?? "—"}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const admin = row.original;
        const isBlocked = admin.status === "blocked";

        return (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/platform/admins/${admin.id}`}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResetPassword(admin)}
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              Reset Password
            </Button>

            {isBlocked ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => onUnblock(admin)}
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Unblock
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onBlock(admin)}
              >
                <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                Block
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle="No admins found"
      emptyDescription="Create your first admin account to get started."
    />
  );
}