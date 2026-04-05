"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { analyticsApi } from "@/api/admin/analytics.api";
import { organizationApi } from "@/api/admin/organization.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  UserSquare2,
  GraduationCap,
  AlertTriangle,
  ArrowRight,
  Building2,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { EnrollmentBreakdownRow } from "@/types/admin/analytics.types";
import { cn } from "@/lib/utils";

// ─── Setup Modal ──────────────────────────────────────────────────────────────

interface SetupForm {
  name: string;
  description: string;
}

function OrgSetupModal({
  open,
  onSuccess,
  onSkip,
}: {
  open: boolean;
  onSuccess: () => void;
  onSkip: () => void;
}): React.JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupForm>({ defaultValues: { name: "", description: "" } });

  const mutation = useMutation({
    mutationFn: organizationApi.createOrg,
    onSuccess: () => {
      toast.success("Organization created! Welcome to EduTool.");
      onSuccess();
    },
    onError: () => toast.error("Failed to create organization."),
  });

  const onSubmit = (values: SetupForm) => {
    mutation.mutate({
      name: values.name,
      description: values.description || undefined,
    });
  };

  return (
    // onOpenChange does nothing — modal is intentionally non-dismissible
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-lg">Set up your organization</DialogTitle>
          <DialogDescription>
            Before you get started, give your school a name. You can update
            this later from the Organization settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">School / Organization Name</Label>
            <Input
              id="org-name"
              placeholder="e.g. St. Mary's Academy"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-desc">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="org-desc"
              placeholder="A brief description of your school..."
              rows={3}
              {...register("description")}
            />
          </div>

<Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Create Organization"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onSkip}
            disabled={mutation.isPending}
          >
            Not now
          </Button>
          
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  isLoading: boolean;
  warning?: boolean;
  action?: { label: string; onClick: () => void };
}

function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
  warning,
  action,
}: StatCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 flex items-start justify-between gap-4",
        warning &&
          value &&
          value > 0 &&
          "border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20"
      )}
    >
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p
            className={cn(
              "text-3xl font-bold tracking-tight",
              warning && value && value > 0 && "text-amber-600"
            )}
          >
            {value ?? 0}
          </p>
        )}
        {action && value && value > 0 && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div
        className={cn(
          "rounded-md p-2 bg-muted",
          warning && value && value > 0 && "bg-amber-100 dark:bg-amber-900/30"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 text-muted-foreground",
            warning && value && value > 0 && "text-amber-600"
          )}
        />
      </div>
    </div>
  );
}

// ─── Enrollment Table Columns ─────────────────────────────────────────────────

const enrollmentColumns: ColumnDef<EnrollmentBreakdownRow>[] = [
  {
    accessorKey: "levelSection",
    header: "Level Section",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.levelSection}</span>
    ),
  },
  {
    accessorKey: "programName",
    header: "Program / Course",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.programName}</span>
    ),
  },
  {
    accessorKey: "gradeLevel",
    header: "Year / Grade",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.gradeLevel}</span>
    ),
  },
  { accessorKey: "sectionName", header: "Section" },
  {
    accessorKey: "activeCount",
    header: "Active",
    cell: ({ row }) => (
      <span className="text-green-600 font-medium">
        {row.original.activeCount}
      </span>
    ),
  },
  {
    accessorKey: "pendingCount",
    header: "Pending",
    cell: ({ row }) => (
      <span
        className={cn(
          row.original.pendingCount > 0
            ? "text-amber-600 font-medium"
            : "text-muted-foreground"
        )}
      >
        {row.original.pendingCount}
      </span>
    ),
  },
  {
    accessorKey: "totalCount",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.totalCount}</span>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["admin", "organization"],
    queryFn: organizationApi.getOrg,
    retry: false, // don't retry 404s
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin", "analytics", "overview"],
    queryFn: analyticsApi.getOverview,
    enabled: org !== null && org !== undefined,
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["admin", "analytics", "enrollment"],
    queryFn: analyticsApi.getEnrollmentBreakdown,
    enabled: org !== null && org !== undefined,
  });

  useEffect(() => {
    if (!orgLoading && org === null) {
      setShowSetup(true);
    }
  }, [org, orgLoading]);

  const handleOrgCreated = () => {
    setShowSetup(false);
    queryClient.invalidateQueries({ queryKey: ["admin", "organization"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
  };

  return (
    <div className="space-y-8">
      <OrgSetupModal
        open={showSetup}
        onSuccess={handleOrgCreated}
        onSkip={() => setShowSetup(false)}
        />

      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={overview?.totalStudents}
          icon={Users}
          isLoading={overviewLoading}
        />
        <StatCard
          label="Total Educators"
          value={overview?.totalEducators}
          icon={UserSquare2}
          isLoading={overviewLoading}
        />
        <StatCard
          label="Active Classes"
          value={overview?.totalClasses}
          icon={GraduationCap}
          isLoading={overviewLoading}
        />
        <StatCard
          label="Pending Students"
          value={overview?.pendingStudents}
          icon={AlertTriangle}
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