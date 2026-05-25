"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { analyticsApi } from "@/api/admin/analytics.api";
import { organizationApi } from "@/api/admin/organization.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
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
      "rounded-lg border bg-card p-5 flex items-start justify-between gap-4",
      warning && value && value > 0 && "border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20"
    )}>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            warning && value && value > 0 && "text-amber-600"
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
        "rounded-md p-2",
        iconColor ?? "bg-muted",
        warning && value && value > 0 && "bg-amber-100 dark:bg-amber-900/30"
      )}>
        <Icon className={cn(
          "h-5 w-5",
          iconColor ? "text-current" : "text-muted-foreground",
          warning && value && value > 0 && "text-amber-600"
        )} />
      </div>
    </div>
  );
}

function OrgSetupModal({
  open,
  onSuccess,
  onSkip,
}: {
  open: boolean;
  onSuccess: () => void;
  onSkip: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<{
    name: string;
    description: string;
  }>({ defaultValues: { name: "", description: "" } });

  const mutation = useMutation({
    mutationFn: organizationApi.createOrg,
    onSuccess: () => { toast.success("Organization created! Welcome to EduTool."); onSuccess(); },
    onError: () => toast.error("Failed to create organization."),
  });

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="icon-container icon-action mb-2">
            <Building2 className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg">Set up your organization</DialogTitle>
          <DialogDescription>
            Before you get started, give your school a name. You can update this later from the
            Organization settings.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) =>
            mutation.mutate({ name: v.name, description: v.description || undefined })
          )}
          className="space-y-4 mt-2"
        >
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
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="org-desc"
              placeholder="A brief description of your school..."
              rows={3}
              {...register("description")}
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
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

const enrollmentColumns: ColumnDef<EnrollmentBreakdownRow>[] = [
  {
    accessorKey: "levelSection",
    header: "Level Section",
    cell: ({ row }) => <span className="font-medium">{row.original.levelSection}</span>,
  },
  {
    accessorKey: "programName",
    header: "Program / Course",
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
      <span className="text-green-600 font-medium">{row.original.activeCount}</span>
    ),
  },
  {
    accessorKey: "pendingCount",
    header: "Pending",
    cell: ({ row }) => (
      <span className={cn(
        row.original.pendingCount > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"
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
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);

  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();

  // Auto-select active year on load
  useEffect(() => {
    if (!selectedYearId && schoolYears.length > 0) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedYearId]);

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["admin", "organization"],
    queryFn: organizationApi.getOrg,
    retry: false,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin", "analytics", "overview", selectedYearId],
    queryFn: () => analyticsApi.getOverview(selectedYearId ?? undefined),
    enabled: !!org && !!selectedYearId,
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["admin", "analytics", "enrollment", selectedYearId],
    queryFn: () => analyticsApi.getEnrollmentBreakdown(selectedYearId ?? undefined),
    enabled: !!org && !!selectedYearId,
  });

  useEffect(() => {
    if (!orgLoading && org === null) setShowSetup(true);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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