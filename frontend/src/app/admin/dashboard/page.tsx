"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/admin/analytics.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserSquare2,
  GraduationCap,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { EnrollmentBreakdownRow } from "@/types/admin/analytics.types";
import { cn } from "@/lib/utils";

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  isLoading: boolean;
  warning?: boolean;
  action?: { label: string; onClick: () => void };
}

function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
  warning,
  action,
}: StatCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 flex items-start justify-between gap-4",
        warning && value && value > 0 && "border-warning/40 bg-warning/5"
      )}
    >
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p
            className={cn(
              "text-3xl font-bold tracking-tight",
              warning && value && value > 0 && "text-warning"
            )}
          >
            {value ?? 0}
          </p>
        )}
        {action && value && value > 0 && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div
        className={cn(
          "rounded-md p-2 bg-muted",
          warning && value && value > 0 && "bg-warning/10"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 text-muted-foreground",
            warning && value && value > 0 && "text-warning"
          )}
        />
      </div>
    </div>
  );
}

// ─── Enrollment Table Columns ─────────────────────────────────────────────────

const enrollmentColumns: ColumnDef<EnrollmentBreakdownRow>[] = [
  {
    accessorKey: "levelSection",
    header: "Level Section",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.levelSection}</span>
    ),
  },
  {
    accessorKey: "programName",
    header: "Program / Course",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.programName}</span>
    ),
  },
  {
    accessorKey: "gradeLevel",
    header: "Year / Grade",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.gradeLevel}</span>
    ),
  },
  {
    accessorKey: "sectionName",
    header: "Section",
  },
  {
    accessorKey: "activeCount",
    header: "Active",
    cell: ({ row }) => (
      <span className="text-green-600 font-medium">{row.original.activeCount}</span>
    ),
  },
  {
    accessorKey: "pendingCount",
    header: "Pending",
    cell: ({ row }) => (
      <span
        className={cn(
          row.original.pendingCount > 0
            ? "text-warning font-medium"
            : "text-muted-foreground"
        )}
      >
        {row.original.pendingCount}
      </span>
    ),
  },
  {
    accessorKey: "totalCount",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.totalCount}</span>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage(): React.JSX.Element {
  const router = useRouter();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin", "analytics", "overview"],
    queryFn: analyticsApi.getOverview,
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["admin", "analytics", "enrollment"],
    queryFn: analyticsApi.getEnrollmentBreakdown,
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={overview?.totalStudents}
          icon={Users}
          isLoading={overviewLoading}
        />
        <StatCard
          label="Total Educators"
          value={overview?.totalEducators}
          icon={UserSquare2}
          isLoading={overviewLoading}
        />
        <StatCard
          label="Active Classes"
          value={overview?.activeClasses}
          icon={GraduationCap}
          isLoading={overviewLoading}
        />
        <StatCard
          label="Pending Students"
          value={overview?.pendingStudents}
          icon={AlertTriangle}
          isLoading={overviewLoading}
          warning
          action={{
            label: "Resolve",
            onClick: () => router.push("/admin/students?status=Pending"),
          }}
        />
      </div>

      {/* Enrollment Breakdown */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Enrollment Breakdown</h2>
        <DataTable
          columns={enrollmentColumns}
          data={enrollment ?? []}
          isLoading={enrollmentLoading}
          emptyTitle="No enrollment data"
          emptyDescription="Enrollment data will appear once students are assigned to sections."
        />
      </div>
    </div>
  );
}