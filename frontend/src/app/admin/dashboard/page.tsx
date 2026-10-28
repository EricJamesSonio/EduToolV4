"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { organizationApi } from "@/api/admin/organization.api";
import {
  useAnalyticsOverview,
  useEnrollmentDistribution,
  useEnrollmentTimeline,
} from "@/hooks/admin/useAnalytics";
import { PageHeader } from "@/components/shared/PageHeader";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Users,
  UserSquare2,
  GraduationCap,
  AlertTriangle,
  ArrowRight,
  X,
} from "lucide-react";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { cn } from "@/lib/utils";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { EnrollmentTrendChart } from "@/components/admin/dashboard/EnrollmentTrendChart";
import {
  DonutChart,
  type DonutDatum,
} from "@/components/admin/dashboard/DonutChart";
import {
  CATEGORY_COLORS,
  OTHERS_COLOR,
  SECTION_COLORS,
  STATUS_COLORS,
} from "@/components/admin/dashboard/dashboard-colors";

const MAX_PROGRAM_SLICES = 6;

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

const EMPTY_RANGE = { startDate: "", endDate: "" };

export default function AdminDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [range, setRange] = useState(EMPTY_RANGE);

  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();

  useEffect(() => {
    if (!selectedYearId && schoolYears.length > 0) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedYearId]);

  const handleSelectYear = useCallback((id: string) => {
    setSelectedYearId(id);
    setRange(EMPTY_RANGE);
  }, []);

  const activeRange =
    range.startDate && range.endDate ? range : undefined;

  const { data: org } = useAsyncQuery(
    queryKeys.admin.organization.detail(),
    organizationApi.getOrg,
    { retry: false },
  );

  const enabled = !!org && !!selectedYearId;

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(
    selectedYearId ?? undefined,
    { enabled },
  );

  const { data: timeline, isLoading: timelineLoading } = useEnrollmentTimeline(
    selectedYearId ?? undefined,
    activeRange,
    { enabled },
  );

  const { data: distribution, isLoading: distributionLoading } =
    useEnrollmentDistribution(selectedYearId ?? undefined, activeRange, {
      enabled,
    });

  const statusData = useMemo<DonutDatum[]>(
    () =>
      (distribution?.studentStatus ?? []).map((slice) => ({
        ...slice,
        color: STATUS_COLORS[slice.key] ?? OTHERS_COLOR,
      })),
    [distribution],
  );

  const programData = useMemo<DonutDatum[]>(() => {
    const slices = distribution?.programs ?? [];
    const head: DonutDatum[] = slices
      .slice(0, MAX_PROGRAM_SLICES)
      .map((slice, i) => ({
        ...slice,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));
    const rest = slices.slice(MAX_PROGRAM_SLICES);
    if (rest.length > 0) {
      head.push({
        key: "others",
        label: "Others",
        value: rest.reduce((sum, slice) => sum + slice.value, 0),
        color: OTHERS_COLOR,
      });
    }
    return head;
  }, [distribution]);

  const sectionData = useMemo<DonutDatum[]>(
    () =>
      (distribution?.sectionAssignment ?? []).map((slice) => ({
        ...slice,
        color: SECTION_COLORS[slice.key] ?? OTHERS_COLOR,
      })),
    [distribution],
  );

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
              onSelect={handleSelectYear}
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

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold not-interactive">Enrollment Analytics</h2>
            <p className="text-sm text-muted-foreground not-interactive">
              {activeRange
                ? "Filtered by enrollment date."
                : "Showing the whole school year. Pick a date range to narrow it down."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-full sm:w-72">
              <DateRangePicker
                startDate={range.startDate}
                endDate={range.endDate}
                onChange={setRange}
                placeholder="Filter by date range"
              />
            </div>
            {(range.startDate || range.endDate) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRange(EMPTY_RANGE)}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-3 space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground not-interactive">
              Enrollments over time
            </h3>
            <p className="text-xs text-muted-foreground not-interactive">
              New student enrollments grouped by their current status.
            </p>
          </div>
          <EnrollmentTrendChart data={timeline} isLoading={timelineLoading} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DonutChart
            title="Student status"
            subtitle="Enrolled students by status"
            data={statusData}
            isLoading={distributionLoading}
            emptyText="No students found for this period."
            centerLabel="Students"
          />
          <DonutChart
            title="Students by program"
            subtitle="Active program enrollments"
            data={programData}
            isLoading={distributionLoading}
            emptyText="No program enrollments found for this period."
            centerLabel="Enrolled"
          />
          <DonutChart
            title="Section assignment"
            subtitle="Are enrolled students placed in a section?"
            data={sectionData}
            isLoading={distributionLoading}
            emptyText="No program enrollments found for this period."
            centerLabel="Enrolled"
          />
        </div>
      </div>
    </div>
  );
}