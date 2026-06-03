"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/admin/analytics.api";
import { organizationApi } from "@/api/admin/organization.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
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
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { cn } from "@/lib/utils";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  iconColor?: string;
  isLoading: boolean;
  warning?: boolean;
  action?: { label: string; onClick: () => void };
}

function StatCard({ label, value, icon: Icon, iconColor, isLoading, warning, action }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl border bg-card p-6 flex items-start justify-between gap-4",
      warning && value && value > 0 && "border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20"
    )}>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            warning && value && value > 0 && "text-amber-600"
          )}>
            {value ?? 0}
          </p>
        )}
        {action && value && value > 0 && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            {action.label} <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className={cn(
        "rounded-md p-2",
        iconColor ?? "bg-muted",
        warning && value && value > 0 && "bg-amber-100 dark:bg-amber-900/30"
      )}>
        <Icon className={cn(
          "h-5 w-5",
          iconColor ? "text-current" : "text-muted-foreground",
          warning && value && value > 0 && "text-amber-600"
        )} />
      </div>
    </div>
  );
}



const enrollmentColumns: ColumnDef<EnrollmentBreakdownRow>[] = [
  {
    accessorKey: "levelSection",
    header: "Level Section",
    cell: ({ row }) => <span className="font-medium">{row.original.levelSection}</span>,
  },
  {
    accessorKey: "programName",
    header: "Program / Course",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.programName}</span>,
  },
  {
    accessorKey: "gradeLevel",
    header: "Year / Grade",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.gradeLevel}</span>,
  },
  { accessorKey: "sectionName", header: "Section" },
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
      <span className={cn(
        row.original.pendingCount > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"
      )}>
        {row.original.pendingCount}
      </span>
    ),
  },
  {
    accessorKey: "totalCount",
    header: "Total",
    cell: ({ row }) => <span className="font-semibold">{row.original.totalCount}</span>,
  },
];

export default function AdminDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);

  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();

  // Auto-select active year on load
  useEffect(() => {
    if (!selectedYearId && schoolYears.length > 0) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedYearId]);

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["admin", "organization"],
    queryFn: organizationApi.getOrg,
    retry: false,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin", "analytics", "overview", selectedYearId],
    queryFn: () => analyticsApi.getOverview(selectedYearId ?? undefined),
    enabled: !!org && !!selectedYearId,
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["admin", "analytics", "enrollment", selectedYearId],
    queryFn: () => analyticsApi.getEnrollmentBreakdown(selectedYearId ?? undefined),
    enabled: !!org && !!selectedYearId,
  });

  return (
    <div className="space-y-8">

      <PageHeader
        title="Dashboard"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_dashboard" />
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={selectedYearId}
              onSelect={setSelectedYearId}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={overview?.totalStudents}
          icon={Users}
          iconColor="icon-people"
          isLoading={overviewLoading}
        />
        <StatCard
          label="Total Educators"
          value={overview?.totalEducators}
          icon={UserSquare2}
          iconColor="icon-educator"
          isLoading={overviewLoading}
        />
        <StatCard
          label="Active Classes"
          value={overview?.totalClasses}
          icon={GraduationCap}
          iconColor="icon-classes"
          isLoading={overviewLoading}
        />
        <StatCard
          label="Pending Students"
          value={overview?.pendingStudents}
          icon={AlertTriangle}
          iconColor="icon-warning"
          isLoading={overviewLoading}
          warning
          action={{
            label: "Resolve",
            onClick: () => router.push("/admin/students?status=Pending"),
          }}
        />
      </div>

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