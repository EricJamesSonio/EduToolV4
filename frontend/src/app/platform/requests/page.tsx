"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { registrationApi, type RegistrationRequest } from "@/api/platform/registration.api";
import { ClipboardCopy, Copy, Check } from "lucide-react";

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

  const [approveDialog, setApproveDialog] = useState<RegistrationRequest | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [rejectConfirm, setRejectConfirm] = useState<RegistrationRequest | null>(null);
  const [credentials, setCredentials] = useState<{
    email: string;
    fullName: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["platform", "registration-requests", { search, page, limit, statusFilter }],
    queryFn: () =>
      registrationApi.list({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit,
      }),
  });

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;

  const approveMutation = useMutation({
    mutationFn: (params: { id: string; email?: string }) =>
      registrationApi.approve(params.id, params.email),
    onSuccess: (result) => {
      setCredentials(result);
      setApproveDialog(null);
      queryClient.invalidateQueries({ queryKey: ["platform", "registration-requests"] });
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
      queryClient.invalidateQueries({ queryKey: ["platform", "registration-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to reject request");
    },
  });

  const sendCredentialsMutation = useMutation({
    mutationFn: (id: string) => registrationApi.sendCredentials(id),
    onSuccess: () => toast.success("Credentials email sent"),
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to send email"),
  });

  const handleCopyPassword = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(credentials.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Registration Requests" />

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
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
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.full_name}</TableCell>
                  <TableCell>{req.email}</TableCell>
                  <TableCell className="capitalize">{req.plan ?? "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusBadge[req.status] ?? ""
                      }`}
                    >
                      {req.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setAdminEmail(req.email);
                            setApproveDialog(req);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectConfirm(req)}
                          className="text-destructive hover:text-destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {req.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendCredentialsMutation.mutate(req.id)}
                        disabled={sendCredentialsMutation.isPending}
                      >
                        Send Email
                      </Button>
                    )}
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
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={(o) => { if (!o) setApproveDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Registration</DialogTitle>
            <DialogDescription>
              Confirm the admin email for{" "}
              <strong>{approveDialog?.full_name ?? ""}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@school.edu"
              />
            </div>
            <Button
              className="w-full"
              onClick={() =>
                approveMutation.mutate({
                  id: approveDialog!.id,
                  email: adminEmail,
                })
              }
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Creating..." : "Create Admin Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Confirm */}
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

      {/* Credentials Dialog */}
      <Dialog open={!!credentials} onOpenChange={(o) => { if (!o) setCredentials(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Created</DialogTitle>
            <DialogDescription>
              Save these credentials. They will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Email</p>
              <p className="text-sm font-mono text-foreground">{credentials?.email ?? ""}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Password</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-foreground flex-1">
                  {credentials?.password ?? ""}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyPassword}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (approveDialog) {
                  sendCredentialsMutation.mutate(approveDialog.id);
                }
              }}
              disabled={sendCredentialsMutation.isPending}
            >
              Send Email to Admin
            </Button>
            <Button
              className="flex-1"
              onClick={() => setCredentials(null)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
