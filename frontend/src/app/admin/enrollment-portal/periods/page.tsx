"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, CalendarRange, ClipboardList, Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { EnrollmentPeriodModal } from "@/components/admin/enrollment-portal/EnrollmentPeriodModal";
import {
  useEnrollmentPeriods,
  useDeleteEnrollmentPeriod,
} from "@/hooks/admin/useEnrollmentPeriods";
import type { EnrollmentPeriod } from "@/types/enrollment-portal.types";

function formatDate(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EnrollmentPeriodsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useEnrollmentPeriods();
  const deleteMutation = useDeleteEnrollmentPeriod();

  const orgSlug = data?.org?.slug ?? null;
  const periods: EnrollmentPeriod[] = data?.periods ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EnrollmentPeriod | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrollmentPeriod | null>(null);

  const copyLink = (token: string) => {
    if (orgSlug) {
      navigator.clipboard
        ?.writeText(`${window.location.origin}/enroll/${orgSlug}/${token}`)
        .then(() => toast.success("Application link copied."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Periods"
        breadcrumbs={[
          { label: "Overview", href: "/admin/enrollment-portal" },
          { label: "Periods" },
        ]}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            size="sm"
          >
            <Plus /> New Period
          </Button>
        }
      />

      <div>
        <Link href="/admin/enrollment-portal">
          <Button variant="outline" size="sm">
            <ClipboardList /> Back to Overview
          </Button>
        </Link>
      </div>

      <AsyncListState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError && periods.length === 0}
        empty={
          <EmptyState
            icon={CalendarRange}
            title="No enrollment periods yet"
            description="Create a period to start accepting applications."
          />
        }
      >
        <div className="rounded-lg border bg-card">
          <div className="divide-y">
            {periods.map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1" onClick={() => router.push(`/admin/enrollment-portal?period_id=${p.id}`)}>
                  <div className="flex items-center gap-2">
                    <span className="cursor-pointer font-medium text-primary group-hover:underline">
                      {p.name}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {p.token}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {p.school_year?.name ?? "—"} · Opens {formatDate(p.start_date)} · Locks{" "}
                    {formatDate(p.lock_date)} · Closes {formatDate(p.end_date)}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyLink(p.token);
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    {orgSlug ? "Copy application link" : `/enroll/${orgSlug ?? "…"}/${p.token}`}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit period"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(p);
                      setModalOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete period"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(p);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AsyncListState>

      <EnrollmentPeriodModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        existing={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete enrollment period?"
        message={`This will remove "${deleteTarget?.name}". This can't be reversed.`}
        confirmLabel="Delete Period"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
      />
    </div>
  );
}