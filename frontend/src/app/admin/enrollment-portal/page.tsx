"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BookOpen,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  Inbox,
  Plus,
  Share2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { SharePortalDialog } from "@/components/admin/enrollment-portal/SharePortalDialog";
import { EnrollmentPeriodModal } from "@/components/admin/enrollment-portal/EnrollmentPeriodModal";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { enrollmentPortalApi } from "@/api/admin/enrollment-portal.api";
import { useEnrollmentPortalDashboard } from "@/hooks/admin/useEnrollmentDashboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type {
  ApplicationListItem,
  EnrollmentPeriodPhase,
  EnrollmentPortalDashboard,
  ProgramOverview,
  ProgramCountRow,
  ProgramCourseCount,
} from "@/types/enrollment-portal.types";

const PHASE_LABEL: Record<EnrollmentPeriodPhase, string> = {
  upcoming: "Upcoming",
  open: "Open",
  locked: "Applications Locked",
  ended: "Ended",
};

const PHASE_CLASS: Record<EnrollmentPeriodPhase, string> = {
  upcoming: "bg-muted text-muted-foreground border-border",
  open: "badge-active",
  locked: "badge-pending",
  ended: "bg-muted text-muted-foreground border-border",
};

function PhaseBadge({ phase }: { phase: EnrollmentPeriodPhase }) {
  return (
    <Badge variant="outline" className={`font-medium capitalize border ${PHASE_CLASS[phase]}`}>
      {PHASE_LABEL[phase]}
    </Badge>
  );
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function CountBar({ applied, enrolled }: { applied: number; enrolled: number }) {
  const pct = applied > 0 ? Math.round((enrolled / applied) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-success" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

function RowCount({ count }: { count: ProgramCountRow | undefined }) {
  const applied = count?.applied ?? 0;
  const enrolled = count?.enrolled ?? 0;
  return (
    <div className="flex items-center gap-2">
      <span className="tabular-nums">{applied}</span>
      <span className="text-muted-foreground">/</span>
      <span className="tabular-nums text-success">{enrolled}</span>
    </div>
  );
}

function ProgramBlock({ program }: { program: ProgramOverview }) {
  return (
    <details className="group rounded-lg border bg-card">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{program.name}</span>
            <Badge variant="secondary" className="text-[11px]">
              {program.type}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{program.applied} applied</span>
            <span>·</span>
            <span className="text-success">{program.approved} enrolled</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <CountBar applied={program.applied} enrolled={program.approved} />
          <span className="text-muted-foreground group-open:rotate-180 transition-transform">
            ▾
          </span>
        </div>
      </summary>

      <div className="divide-y">
        {program.courses.map((course) => (
          <CourseRow key={course.id} course={course} />
        ))}
        {program.strands.map((strand) => (
          <div key={strand.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
            <span className="text-sm">{strand.name}</span>
            <RowCount count={strand} />
          </div>
        ))}
        {program.levels.map((level) => (
          <div key={level.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
            <span className="text-sm">Level · {level.name}</span>
            <RowCount count={level} />
          </div>
        ))}
        {program.courses.length === 0 &&
          program.strands.length === 0 &&
          program.levels.length === 0 && (
            <p className="px-4 py-2 text-sm text-muted-foreground">No track breakdown.</p>
          )}
      </div>
    </details>
  );
}

function CourseRow({ course }: { course: ProgramCourseCount }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-2 hover:bg-muted/40">
        <span className="text-sm">{course.name}</span>
        <span className="flex items-center gap-2">
          <RowCount count={course} />
          <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
        </span>
      </summary>
      <div className="space-y-1 bg-muted/20 px-6 py-2">
        {course.levels.map((level) => (
          <div
            key={level.id}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span className="text-muted-foreground">{level.name}</span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums">
                {level.applied}
                <span className="text-muted-foreground">/{level.enrolled} enrolled</span>
              </span>
            </div>
          </div>
        ))}
        {course.levels.length === 0 && (
          <p className="text-xs text-muted-foreground">No level breakdown.</p>
        )}
      </div>
    </details>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground not-interactive">{label}</p>
        <span className={iconClass}>{icon}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums not-interactive">{value}</p>
      <p className="text-xs text-muted-foreground not-interactive">{hint}</p>
    </div>
  );
}

const APPLICATION_COLUMNS: ColumnDef<ApplicationListItem>[] = [
  {
    accessorKey: "application_code",
    header: "Code",
    size: 90,
    cell: (c) => <span className="font-mono">{c.row.original.application_code}</span>,
  },
  { header: "Name", cell: (c) => c.row.original.full_name },
  { header: "Email", cell: (c) => c.row.original.personal_email },
  { header: "Department", cell: (c) => c.row.original.program },
  {
    accessorKey: "status",
    header: "Status",
    cell: (c) => <StatusBadge status={c.row.original.status} />,
  },
];

export default function EnrollmentPortalDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    searchParams.get("period_id") ?? "",
  );
  const dashboardQuery = useEnrollmentPortalDashboard(selectedPeriodId || undefined);
  const data: EnrollmentPortalDashboard | undefined = dashboardQuery.data;

  const [tab, setTab] = useState("applications");
  const [shareOpen, setShareOpen] = useState(false);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchCode(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const available = data?.availablePeriods ?? [];
  const selected =
    available.find((p) => p.id === selectedPeriodId) ??
    data?.dashboard?.period ??
    available[0];
  const activeId = selected?.id ?? "";

  const applicationsQuery = useAsyncQuery(
    queryKeys.admin.enrollmentPortal.applications.list({
      dashboardPeriod: activeId,
      dashboardSearch: searchCode,
      page,
      limit,
    }),
    () =>
      enrollmentPortalApi.getApplications({
        period_id: activeId,
        application_code: searchCode || undefined,
        page,
        limit,
      }),
    { enabled: activeId.length > 0 },
  );

  const applications = applicationsQuery.data?.data ?? [];
  const applicationsTotal = applicationsQuery.data?.total ?? 0;

  const summary = data?.dashboard?.summary;
  const programs = data?.dashboard?.programs ?? [];
  const total = data?.dashboard?.total ?? 0;

  const handlePeriodChange = (value: string | null) => {
    setSelectedPeriodId(value ?? "");
    setPage(1);
    if (value) {
      router.replace(`/admin/enrollment-portal?period_id=${value}`);
    } else {
      router.replace("/admin/enrollment-portal");
    }
  };

  const hasPeriods = available.length > 0;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Enrollment Portal"
        actions={
          hasPeriods ? (
            <div className="flex items-center gap-2">
              <Select value={activeId} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-56 sm:w-64">
                  <span className="truncate">{selected?.name ?? "Select a period"}</span>
                </SelectTrigger>
                <SelectContent>
                  {available.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShareOpen(true)}
                disabled={!selected?.token}
              >
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          ) : undefined
        }
      />

      <EnrollmentPeriodModal
        open={periodModalOpen}
        onClose={() => setPeriodModalOpen(false)}
      />

      {dashboardQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : !hasPeriods ? (
        <EmptyState
          icon={Inbox}
          title="No enrollment periods yet"
          description="Create a period and share the link to start accepting applications."
          action={{
            label: "Create your first period",
            onClick: () => setPeriodModalOpen(true),
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {selected && <PhaseBadge phase={selected.status} />}
              {selected?.school_year && (
                <Badge variant="outline">{selected.school_year.name}</Badge>
              )}
              {selected && (
                <span>
                  {fmtDate(selected.start_date)} – {fmtDate(selected.end_date)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/enrollment-portal/applications${activeId ? `?period_id=${activeId}` : ""}`}
              >
                <Button variant="outline" size="sm">
                  <ClipboardList /> Review Applications
                </Button>
              </Link>
              <Link href="/admin/enrollment-portal/periods">
                <Button variant="outline" size="sm">
                  <CalendarRange /> View Periods
                </Button>
              </Link>
              <Button size="sm" onClick={() => setPeriodModalOpen(true)}>
                <Plus /> New Period
              </Button>
            </div>
          </div>

          <SharePortalDialog
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            periodName={selected?.name ?? ""}
            token={selected?.token ?? ""}
            orgSlug={data?.org?.slug ?? null}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Applications"
              value={total}
              hint="in this period"
              icon={<Users className="h-4 w-4" />}
              iconClass="text-info"
            />
            <StatCard
              label="In Review"
              value={(summary?.pending ?? 0) + (summary?.locked ?? 0)}
              hint="pending or locked"
              icon={<CalendarClock className="h-4 w-4" />}
              iconClass="text-warning"
            />
            <StatCard
              label="Enrolled"
              value={summary?.approved ?? 0}
              hint="approved applications"
              icon={<UserCheck className="h-4 w-4" />}
              iconClass="text-success"
            />
            <StatCard
              label="Rejected"
              value={summary?.rejected ?? 0}
              hint="declined applications"
              icon={<UserX className="h-4 w-4" />}
              iconClass="text-destructive"
            />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="applications">
                <ClipboardList className="h-4 w-4 mr-1.5" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="departments">
                <BookOpen className="h-4 w-4 mr-1.5" />
                Departments &amp; Courses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4 pt-4">
              <SearchInput
                value={searchInput}
                onChange={(v) => setSearchInput(v)}
                placeholder="Search by application code, e.g. AB12"
                className="max-w-sm"
              />
              <DataTable
                columns={APPLICATION_COLUMNS}
                data={applications}
                isLoading={applicationsQuery.isLoading}
                emptyTitle={
                  searchCode ? "No application matched that code" : "No applications yet"
                }
                emptyDescription={
                  searchCode
                    ? "Double-check the code and try again."
                    : "Applications submitted through the portal will appear here."
                }
                onRowClick={(row) =>
                  router.push(`/admin/enrollment-portal/applications/${row.id}`)
                }
                className="rounded-lg border"
              />
              <Pagination
                page={page}
                limit={limit}
                total={applicationsTotal}
                onPageChange={setPage}
                onLimitChange={setLimit}
                pageSizeOptions={[10, 20, 50]}
              />
            </TabsContent>

            <TabsContent value="departments" className="space-y-3 pt-4">
              <p className="px-1 text-xs text-muted-foreground">
                {programs.length} department{programs.length !== 1 ? "s" : ""} · applied / enrolled
              </p>
              {programs.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No departments set up for this school year"
                  description="Departments are defined per school year. Add departments before applicants can choose them."
                />
              ) : (
                <div className="space-y-2">
                  {programs.map((program) => (
                    <ProgramBlock key={program.id} program={program} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}