"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { registrationApi, type RegistrationRequest } from "@/api/platform/registration.api";
import {
  RequestViewDialog,
  RequestApproveDialog,
  CredentialsDialog,
} from "@/components/platform/RequestDetailDialog";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
};

export default function PlatformRequestsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewDialog, setViewDialog] = useState<RegistrationRequest | null>(null);
  const [approveDialog, setApproveDialog] = useState<RegistrationRequest | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<RegistrationRequest | null>(null);
  const [credentials, setCredentials] = useState<{
    email: string;
    fullName: string;
    password: string;
  } | null>(null);

  const { data, isLoading } = useAsyncQuery(
    queryKeys.platform.registrationRequests.list({ search, page, limit, statusFilter }),
    () => registrationApi.list({
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      page,
      limit,
    }),
  );

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;

  const approveMutation = useMutation({
    mutationFn: (params: { id: string; email: string }) =>
      registrationApi.approve(params.id, params.email),
    onSuccess: (result) => {
      setCredentials(result);
      setApproveDialog(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.registrationRequests.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to approve request");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => registrationApi.reject(id),
    onSuccess: () => {
      toast.success("Request rejected");
      setRejectConfirm(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.registrationRequests.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to reject request");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Registration Requests" description="Review and approve school registration requests." />

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name or email..."
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No registration requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setViewDialog(req)}
                >
                  <TableCell className="font-medium">{req.full_name}</TableCell>
                  <TableCell className="max-w-36 truncate">{req.email}</TableCell>
                  <TableCell className="max-w-32 truncate">{req.institution_name ?? "—"}</TableCell>
                  <TableCell className="capitalize">{req.plan ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusBadge[req.status] ?? ""
                      }`}
                    >
                      {req.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(req.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      )}

      <RequestViewDialog
        request={viewDialog}
        onClose={() => setViewDialog(null)}
        onApprove={(req) => {
          setApproveDialog(req);
          setViewDialog(null);
        }}
        onReject={(req) => {
          setRejectConfirm(req);
          setViewDialog(null);
        }}
      />

      <RequestApproveDialog
        request={approveDialog}
        isLoading={approveMutation.isPending}
        onClose={() => setApproveDialog(null)}
        onConfirm={(id, email) => approveMutation.mutate({ id, email })}
      />

      {rejectConfirm && (
        <ConfirmDialog
          open
          title="Reject Registration?"
          message={`Reject registration from ${rejectConfirm.full_name} (${rejectConfirm.email})?`}
          confirmLabel="Reject"
          destructive
          isLoading={rejectMutation.isPending}
          onConfirm={() => rejectMutation.mutate(rejectConfirm.id)}
          onOpenChange={(o) => { if (!o) setRejectConfirm(null); }}
        />
      )}

      <CredentialsDialog
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />
    </div>
  );
}