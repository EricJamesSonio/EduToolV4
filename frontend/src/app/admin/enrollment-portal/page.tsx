"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const SEARCH_COLUMNS: ColumnDef<ApplicationListItem>[] = [
  { accessorKey: "application_code", header: "Code", size: 90, cell: (c) => <span className="font-mono">{c.row.original.application_code}</span> },
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

  const [searchInput, setSearchInput] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const searchQuery = useAsyncQuery(
    queryKeys.admin.enrollmentPortal.applications.list({ dashboardSearch: searchCode }),
    () => enrollmentPortalApi.getApplications({ application_code: searchCode || undefined }),
    { enabled: searchCode.trim().length > 0 },
  );

  const available = data?.availablePeriods ?? [];
  const selected =
    available.find((p) => p.id === selectedPeriodId) ??
    data?.dashboard?.period ??
    available[0];
  const activeId = selected?.id ?? "";

  const summary = data?.dashboard?.summary;
  const programs = data?.dashboard?.programs ?? [];
  const total = data?.dashboard?.total ?? 0;

  const handlePeriodChange = (value: string | null) => {
    setSelectedPeriodId(value ?? "");
    if (value) {
      router.replace(`/admin/enrollment-portal?period_id=${value}`);
    } else {
      router.replace("/admin/enrollment-portal");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollment Portal"
        actions={
          <>
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
          </>
        }
      />

      <EnrollmentPeriodModal
        open={periodModalOpen}
        onClose={() => setPeriodModalOpen(false)}
      />

      {dashboardQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="md" />
        </div>
      ) : available.length === 0 ? (
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
          {/* Period selector */}
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={activeId} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-full sm:w-72">
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
                {selected && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShareOpen(true)}
                      disabled={!selected.token}
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </Button>
                    <PhaseBadge phase={selected.status} />
                    {selected.school_year && (
                      <Badge variant="outline">SY {selected.school_year.name}</Badge>
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      {selected.token}
                    </span>
                  </div>
                )}
              </div>
              {selected && (
                <p className="text-sm text-muted-foreground">
                  School year selected on this period:{" "}
                  <span className="font-medium text-foreground">
                    {selected.school_year?.name ?? "—"}
                  </span>
                  {"  ·  "}
                  {fmtDate(selected.start_date)} – {fmtDate(selected.end_date)}
                </p>
              )}
            </CardContent>
          </Card>

          <SharePortalDialog
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            periodName={selected?.name ?? ""}
            token={selected?.token ?? ""}
            orgSlug={data?.org?.slug ?? null}
          />

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Applications" value={total} icon={<Users className="h-5 w-5 text-info" />} tone="bg-info/10" />
            <StatCard label="In Review" value={(summary?.pending ?? 0) + (summary?.locked ?? 0)} icon={<CalendarClock className="h-5 w-5 text-warning" />} tone="bg-warning/10" />
            <StatCard label="Enrolled (Approved)" value={summary?.approved ?? 0} icon={<UserCheck className="h-5 w-5 text-success" />} tone="bg-success/10" />
            <StatCard label="Rejected" value={summary?.rejected ?? 0} icon={<UserX className="h-5 w-5 text-destructive" />} tone="bg-destructive/10" />
          </div>

          <Separator />

          {/* Application by code lookup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Find an application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter the application code (or a partial code) that was given to the applicant
                when they submitted.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={searchInput}
                  onChange={(v) => setSearchInput(v)}
                  placeholder="e.g. AB12 or LOCK-EXP-A2"
                  className="max-w-sm"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSearchCode(searchInput.trim())}
                  disabled={!searchInput.trim()}
                >
                  Search
                </Button>
              </div>

              {searchCode && (
                <DataTable
                  columns={SEARCH_COLUMNS}
                  data={searchQuery.data?.data ?? []}
                  isLoading={searchQuery.isLoading}
                  emptyTitle="No application matched that code"
                  emptyDescription="Double-check the code and try again."
                  onRowClick={(row) =>
                    router.push(`/admin/enrollment-portal/applications/${row.id}`)
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Programs overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Departments &amp; Courses</h2>
              <span className="text-sm text-muted-foreground">
                {programs.length} department{programs.length !== 1 ? "s" : ""}
              </span>
            </div>
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
          </div>
        </>
      )}
    </div>
  );
}