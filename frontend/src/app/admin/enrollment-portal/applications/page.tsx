"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Ban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RejectApplicationDialog } from "@/components/admin/enrollment-portal/RejectApplicationDialog";
import { UnlockApplicationDialog } from "@/components/admin/enrollment-portal/UnlockApplicationDialog";
import {
  useEnrollmentApplications,
  useApplicationFilters,
  useApproveApplication,
} from "@/hooks/admin/useEnrollmentApplications";
import { useEnrollmentPeriods } from "@/hooks/admin/useEnrollmentPeriods";
import type { ApplicationListItem } from "@/types/enrollment-portal.types";

function fmtSubmitted(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EnrollmentApplicationsPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const periodParam = searchParams.get("period_id") ?? "";
  const filters = useApplicationFilters(periodParam);
  const { data, isLoading } = useEnrollmentApplications(filters.query);
  const approveMutation = useApproveApplication();
  const { data: periodList } = useEnrollmentPeriods();

  const [approveTarget, setApproveTarget] = useState<ApplicationListItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApplicationListItem | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const periods = periodList?.periods ?? [];
  const activePeriod = periods.find((p) => p.id === filters.periodId);

  const columns = useMemo<ColumnDef<ApplicationListItem>[]>(
    () => [
      {
        accessorKey: "application_code",
        header: "Code",
        size: 90,
      },
      { accessorKey: "full_name", header: "Name" },
      { accessorKey: "personal_email", header: "Email" },
      {
        header: "Department / Level",
        cell: ({ row }) => (
          <span>
            {row.original.level}
            <span className="text-muted-foreground"> · {row.original.program}</span>
            {row.original.course ? ` · ${row.original.course}` : ""}
            {row.original.strand ? ` · ${row.original.strand}` : ""}
          </span>
        ),
      },
      { accessorKey: "period", header: "Period" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "submitted_at",
        header: "Submitted",
        cell: ({ row }) => fmtSubmitted(row.original.submitted_at),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const a = row.original;
          const reviewable = a.status === "pending";
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Approve ${a.application_code}`}
                disabled={!reviewable || approveMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  if (reviewable) setApproveTarget(a);
                }}
              >
                <Check className="h-4 w-4 text-emerald-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Reject ${a.application_code}`}
                disabled={!reviewable}
                onClick={(e) => {
                  e.stopPropagation();
                  if (reviewable) setRejectTarget(a);
                }}
              >
                <Ban className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        },
      },
    ],
    [approveMutation.isPending],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={activePeriod ? `${activePeriod.name} — Applications` : "Enrollment Applications"}
        description="Review and process applicant submissions."
        breadcrumbs={[
          {
            label: "Overview",
            href: activePeriod
              ? `/admin/enrollment-portal?period_id=${activePeriod.id}`
              : "/admin/enrollment-portal",
          },
          { label: "Applications" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => setUnlockOpen(true)}>
            <Plus /> Unlock
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={filters.search}
          onChange={(v) => filters.setSearch(v)}
          placeholder="Search by code or email…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filters.status} onValueChange={(v) => filters.setStatus((v ?? "") as "" | "pending" | "locked" | "approved" | "rejected")}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.periodId}
            onValueChange={(v) => {
              filters.setPeriodId(v ?? "");
              router.replace(v ? `/admin/enrollment-portal/applications?period_id=${v}` : "/admin/enrollment-portal/applications");
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All periods</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/admin/enrollment-portal/applications/${row.id}`)}
      />

      <div className="flex justify-end">
        <Pagination
          page={data?.page ?? 1}
          limit={data?.limit ?? filters.limit}
          total={data?.total ?? 0}
          onPageChange={filters.setPage}
          onLimitChange={(l) => {
            filters.setLimit(l);
            filters.setPage(1);
          }}
        />
      </div>

      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={(o) => !o && setApproveTarget(null)}
        title="Approve application?"
        message={`This creates a student account and enrolls ${approveTarget?.full_name ?? ""} (${approveTarget?.application_code ?? ""}). Their login credentials will be emailed to them.`}
        confirmLabel="Approve"
        isLoading={approveMutation.isPending}
        onConfirm={() =>
          approveTarget &&
          approveMutation.mutate(approveTarget.id, { onSuccess: () => setApproveTarget(null) })
        }
      />

      <RejectApplicationDialog
        open={!!rejectTarget}
        application={rejectTarget}
        onClose={() => setRejectTarget(null)}
      />

      <UnlockApplicationDialog open={unlockOpen} onClose={() => setUnlockOpen(false)} />
    </div>
  );
}