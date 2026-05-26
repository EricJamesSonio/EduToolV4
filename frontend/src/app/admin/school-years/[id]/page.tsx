// frontend\src\app\admin\school-years\[id]\page.tsx
"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery }      from "@tanstack/react-query";
import Link              from "next/link";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { EnrollmentTab } from "@/components/admin/enrollment/EnrollmentTab";
import { OverviewTab }   from "@/components/admin/school-years/OverviewTab";
import { ProgramsTab }   from "@/components/admin/school-years/ProgramsTab";
import { StatusBadge }   from "@/components/shared/StatusBadge";
import { Skeleton }      from "@/components/ui/skeleton";
import { AlertTriangle, BookOpen, ChevronLeft, Users } from "lucide-react";
import { cn }            from "@/lib/utils";
import type { Tab }      from "@/components/admin/school-years/constants";

export default function SchoolYearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id }       = use(params);
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const { data: schoolYear, isLoading } = useQuery({
    queryKey: ["admin", "school-years", id],
    queryFn:  () => schoolYearApi.getById(id),
  });

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!schoolYear) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        School year not found.
      </p>
    );
  }

  const isEnded = schoolYear.status === "ended";

  const TABS: { key: Tab; label: string; icon?: React.ReactNode }[] = [
    { key: "overview",   label: "Overview" },
    { key: "enrollment", label: "Enrollment", icon: <Users    className="inline mr-1.5 h-3.5 w-3.5" /> },
    { key: "programs",   label: "Programs",   icon: <BookOpen className="inline mr-1.5 h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/admin/school-years"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        School Years
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{schoolYear.name}</h1>
        <StatusBadge status={schoolYear.status} />
      </div>

      {/* Ended banner */}
      {isEnded && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This school year has ended and is read-only.
        </div>
      )}

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "overview"   && <OverviewTab schoolYear={schoolYear} />}
        {activeTab === "enrollment" && <EnrollmentTab schoolYearId={id} isEnded={isEnded} />}
        {activeTab === "programs"   && <ProgramsTab schoolYearId={id} isEnded={isEnded} />}
      </div>
    </div>
  );
}