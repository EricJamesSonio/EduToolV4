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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, UserSquare2, GraduationCap, AlertTriangle, ArrowRight, Building2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { EnrollmentBreakdownRow } from "@/types/admin/analytics.types";
import { cn } from "@/lib/utils";

// ── Program options ────────────────────────────────────────────────────────────

const PROGRAM_OPTIONS = [
  {
    key: "daycare",
    label: "Daycare / Pre-School",
    description: "Daycare 1 & 2 with foundational learning areas",
  },
  {
    key: "kinder",
    label: "Kindergarten",
    description: "Kinder 1 & 2 with early childhood curriculum",
  },
  {
    key: "elementary",
    label: "Elementary School",
    description: "Grade 1–6 with core K-12 subjects",
  },
  {
    key: "jhs",
    label: "Junior High School",
    description: "Grade 7–10 with core K-12 subjects",
  },
  {
    key: "shs",
    label: "Senior High School",
    description: "Grade 11–12 across all SHS strands",
  },
  {
    key: "college",
    label: "College / University",
    description: "Year-level courses with full subject curriculum",
  },
] as const;

// ── Setup Form types ───────────────────────────────────────────────────────────

interface SetupForm {
  name: string;
  description: string;
}

// ── OrgSetupModal ──────────────────────────────────────────────────────────────

function OrgSetupModal({
  open,
  onSuccess,
  onSkip,
}: {
  open: boolean;
  onSuccess: () => void;
  onSkip: () => void;
}): React.JSX.Element {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<SetupForm>({
    defaultValues: { name: "", description: "" },
  });

  const mutation = useMutation({
    mutationFn: organizationApi.createOrg,
    onSuccess: () => {
      toast.success("Organization created! Welcome to EduTool.");
      onSuccess();
    },
    onError: () => toast.error("Failed to create organization."),
  });

  function toggleProgram(key: string) {
    setSelectedPrograms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleNext() {
    const valid = await trigger(["name"]);
    if (valid) setStep(2);
  }

  function handleBack() {
    setStep(1);
  }

  function handleFinish() {
    const values = getValues();
    mutation.mutate({
      name: values.name,
      description: values.description || undefined,
      programs: selectedPrograms.length > 0 ? selectedPrograms : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-lg">
            {step === 1 ? "Set up your organization" : "Select your programs"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Before you get started, give your school a name. You can update this later from the Organization settings."
              : "Choose the programs your school offers. We'll seed your levels, sections, subjects, and grading scales automatically. You can skip this and set it up manually later."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-1">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 1 — Org details */}
        {step === 1 && (
          <div className="space-y-4 mt-2">
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
            <Button type="button" className="w-full" onClick={handleNext}>
              Next
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onSkip}
            >
              Not now
            </Button>
          </div>
        )}

        {/* Step 2 — Program selection */}
        {step === 2 && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 gap-2">
              {PROGRAM_OPTIONS.map((prog) => {
                const selected = selectedPrograms.includes(prog.key);
                return (
                  <button
                    key={prog.key}
                    type="button"
                    onClick={() => toggleProgram(prog.key)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                      selected && "border-primary bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {prog.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {prog.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleBack}
                disabled={mutation.isPending}
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleFinish}
                disabled={mutation.isPending}
              >
                {mutation.isPending
                  ? "Setting up..."
                  : selectedPrograms.length > 0
                  ? `Set up (${selectedPrograms.length} program${selectedPrograms.length > 1 ? "s" : ""})`
                  : "Skip & finish"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  isLoading: boolean;
  warning?: boolean;
  action?: { label: string; onClick: () => void };
}

function StatCard({ label, value, icon: Icon, isLoading, warning, action }: StatCardProps): React.JSX.Element {
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
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className={cn(
        "rounded-md p-2 bg-muted",
        warning && value && value > 0 && "bg-amber-100 dark:bg-amber-900/30"
      )}>
        <Icon className={cn(
          "h-5 w-5 text-muted-foreground",
          warning && value && value > 0 && "text-amber-600"
        )} />
      </div>
    </div>
  );
}

// ── Enrollment table columns ───────────────────────────────────────────────────

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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["admin", "organization"],
    queryFn: organizationApi.getOrg,
    retry: false,
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
        <StatCard label="Total Students" value={overview?.totalStudents} icon={Users} isLoading={overviewLoading} />
        <StatCard label="Total Educators" value={overview?.totalEducators} icon={UserSquare2} isLoading={overviewLoading} />
        <StatCard label="Active Classes" value={overview?.totalClasses} icon={GraduationCap} isLoading={overviewLoading} />
        <StatCard
          label="Pending Students"
          value={overview?.pendingStudents}
          icon={AlertTriangle}
          isLoading={overviewLoading}
          warning
          action={{ label: "Resolve", onClick: () => router.push("/admin/students?status=Pending") }}
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