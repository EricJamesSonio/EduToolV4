"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Ban, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RejectApplicationDialog } from "@/components/admin/enrollment-portal/RejectApplicationDialog";
import {
  useApplicationDetail,
  useApproveApplication,
  useUnlockApplication,
} from "@/hooks/admin/useEnrollmentApplications";

function fmt(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-right">{value ?? "—"}</dd>
    </div>
  );
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const { data: app, isLoading, isError } = useApplicationDetail(id);
  const approveMutation = useApproveApplication();
  const unlockMutation = useUnlockApplication();

  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading application…</div>
    );
  }

  if (isError || !app) {
    return (
      <div className="p-6 text-sm text-destructive">
        Application not found.{" "}
        <Link href="/admin/enrollment-portal/applications" className="underline">
          Back to applications
        </Link>
      </div>
    );
  }

  const isPending = app.status === "pending";
  const isLocked = app.status === "locked";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/enrollment-portal/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Applications
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge status={app.status} />
          {isPending && (
            <>
              <Button
                size="sm"
                onClick={() => setConfirmApprove(true)}
                disabled={approveMutation.isPending}
              >
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                <Ban className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
          {isLocked && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                unlockMutation.mutate({ application_code: app.application_code })
              }
              disabled={unlockMutation.isPending}
            >
              <Unlock className="h-4 w-4" /> Unlock
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Applicant</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row
                label="Name"
                value={[app.first_name, app.middle_name, app.last_name].filter(Boolean).join(" ")}
              />
              <Row label="Email" value={app.personal_email} />
              <Row label="Age" value={app.age} />
              <Row label="Address" value={app.address} />
              <Row label="Contact number" value={app.contact_number} />
              <Row label="Last school graduated" value={app.last_school_graduated} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row label="Code" value={<span className="font-mono">{app.application_code}</span>} />
              <Row label="Department" value={app.program?.name} />
              <Row label="Course" value={app.course?.name} />
              <Row label="Strand" value={app.strand?.name} />
              <Row label="Level" value={app.level?.name} />
              <Row label="Assigned section" value={app.section?.name} />
              <Row label="Period" value={app.period?.name} />
              <Row label="School year" value={app.school_year?.name} />
              <Row label="Submitted" value={fmt(app.submitted_at)} />
              {app.rejection_reason && (
                <Row label="Rejection reason" value={app.rejection_reason} />
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmApprove}
        onOpenChange={setConfirmApprove}
        title="Approve application?"
        message={`This creates a student account and enrolls ${app.first_name} ${app.last_name}. Their login credentials will be emailed to ${app.personal_email}.`}
        confirmLabel="Approve"
        isLoading={approveMutation.isPending}
        onConfirm={() =>
          approveMutation.mutate(app.id, { onSuccess: () => setConfirmApprove(false) })
        }
      />

      <RejectApplicationDialog open={rejectOpen} application={app} onClose={() => setRejectOpen(false)} />
    </div>
  );
}