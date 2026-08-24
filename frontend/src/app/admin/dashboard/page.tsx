"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { DEFAULT_PAGE_SIZE } from "@/api/admin/analytics.api";
import { organizationApi } from "@/api/admin/organization.api";
import { useAnalyticsOverview, useEnrollmentBreakdown } from "@/hooks/admin/useAnalytics";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
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
      "rounded-xl border border-border bg-card p-3 sm:p-5 lg:p-6 flex items-start justify-between gap-2 sm:gap-4 shadow-sm",
      warning && value && value > 0 && "border-warning/40 bg-warning/15"
    )}>
      <div className="space-y-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-foreground not-interactive">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className={cn(
            "text-xl sm:text-3xl font-extrabold tracking-tight not-interactive text-foreground",
            warning && value && value > 0 && "text-warning"
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
        "rounded-md p-1.5 sm:p-2 shrink-0",
        iconColor ?? "bg-muted",
        warning && value && value > 0 && "bg-warning/15"
      )}>
        <Icon className={cn(
          "h-4 w-4 sm:h-5 sm:w-5",
          iconColor ? "text-current" : "text-muted-foreground",
          warning && value && value > 0 && "text-warning"
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
    header: "Department / Course",
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
      <span className="text-success font-medium">{row.original.activeCount}</span>
    ),
  },
  {
    accessorKey: "pendingCount",
    header: "Pending",
    cell: ({ row }) => (
      <span className={cn(
        row.original.pendingCount > 0 ? "text-warning font-medium" : "text-muted-foreground"
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
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const [enrollmentLimit, setEnrollmentLimit] = useState(DEFAULT_PAGE_SIZE);

  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();

  useEffect(() => {
    if (!selectedYearId && schoolYears.length > 0) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedYearId]);

  useEffect(() => {
    setEnrollmentPage(1);
  }, [selectedYearId]);

  const { data: org, isLoading: orgLoading } = useAsyncQuery(
    queryKeys.admin.organization.detail(),
    organizationApi.getOrg,
    { retry: false },
  );

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(
    selectedYearId ?? undefined,
    { enabled: !!org && !!selectedYearId },
  );

  const {
    data: enrollment,
    isLoading: enrollmentLoading,
  } = useEnrollmentBreakdown(
    selectedYearId ?? undefined,
    enrollmentPage,
    enrollmentLimit,
    { enabled: !!org && !!selectedYearId },
  );

  const enrollmentRows = enrollment?.data ?? [];
  const enrollmentTotal = enrollment?.meta?.total ?? 0;
  const enrollmentTotalPages = enrollment?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (enrollmentPage > enrollmentTotalPages) setEnrollmentPage(Math.max(1, enrollmentTotalPages));
  }, [enrollmentPage, enrollmentTotalPages]);

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

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
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
        <h2 className="text-base font-semibold not-interactive">Enrollment Breakdown</h2>
        <DataTable
          columns={enrollmentColumns}
          data={enrollmentRows}
          isLoading={enrollmentLoading}
          emptyTitle="No enrollment data"
          emptyDescription="Enrollment data will appear once students are assigned to sections."
        />
        {enrollmentTotal > 0 && (
          <Pagination
            page={enrollmentPage}
            limit={enrollmentLimit}
            total={enrollmentTotal}
            onPageChange={setEnrollmentPage}
            onLimitChange={(l) => { setEnrollmentLimit(l); setEnrollmentPage(1); }}
            pageSizeOptions={[20, 50, 100]}
          />
        )}
      </div>
    </div>
  );
}