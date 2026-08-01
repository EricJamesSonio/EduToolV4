"use client";

import { useState } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useRouter } from "next/navigation";
import { Download, ArrowLeft, ShieldAlert, RefreshCw } from "lucide-react";

import { studentApi } from "@/api/admin/student.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ColumnDef } from "@tanstack/react-table";
import client from "@/api/client";

interface CredentialRow {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  status: string;
  passwordResetAt: string | null;
  levelName: string | null;
}

interface ApiResponse<T> { success: boolean; data: T; }

async function getCredentialsList(): Promise<CredentialRow[]> {
  const res = await client.get<ApiResponse<CredentialRow[]>>("/students/credentials");
  return res.data.data;
}

const columns: ColumnDef<CredentialRow>[] = [
  {
    header: "Full Name",
    accessorKey: "fullName",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    header: "Email",
    accessorKey: "email",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
    ),
  },
  {
    header: "Student ID",
    accessorKey: "studentId",
    cell: ({ getValue }) => (
      <span className="text-sm font-mono text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    header: "Level",
    accessorKey: "levelName",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue<string | null>() ?? "—"}
      </span>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
  },
  {
    header: "Last Reset",
    accessorKey: "passwordResetAt",
    cell: ({ getValue }) => {
      const v = getValue<string | null>();
      return (
        <span className="text-xs text-muted-foreground">
          {v ? new Date(v).toLocaleDateString() : "Never"}
        </span>
      );
    },
  },
];

export default function CredentialsPage(): React.JSX.Element {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useAsyncQuery(
    [...queryKeys.admin.students.all, 'credentials-list'] as const,
    getCredentialsList,
  );

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await client.get("/students/credentials-csv", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `student-credentials-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Credentials"
        description="Import students and generate their login credentials."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/students")}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={downloading}>
              <Download className="mr-1.5 h-4 w-4" />
              {downloading ? "Downloading..." : "Download CSV"}
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Sensitive information
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
            The downloaded CSV contains plain-text passwords. Store it securely and delete it after distributing credentials to students.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        emptyTitle="No credentials found"
        emptyDescription="Students will appear here once created."
      />
    </div>
  );
}
