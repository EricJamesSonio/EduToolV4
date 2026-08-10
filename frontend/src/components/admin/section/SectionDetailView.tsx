"use client";

// frontend/src/components/admin/section/SectionDetailView.tsx
// Shared layout used by both section detail pages (program-context and admin).
// Renders a header with a back link, an optional context card, and the
// Students / Classes / Weekly Schedule tabs.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users, BookOpen, CalendarDays, Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  StudentsTab,
  ClassesTab,
  WeeklyScheduleTab,
} from "@/components/admin/section/SectionTabs";
import type { Section } from "@/types/admin/section.types";

type TabKey = "students" | "classes" | "schedule";

interface Crumb {
  label: string;
  href?: string;
}

interface SectionDetailViewProps {
  section: Section | null;
  schoolYearId: string;
  isEnded?: boolean;
  isLoading: boolean;
  backHref: string;
  backLabel?: string;
  breadcrumbs: Crumb[];
  context?: { label: string; value: React.ReactNode }[];
  notFound?: boolean;
}

export function SectionDetailView({
  section,
  schoolYearId,
  isEnded = false,
  isLoading,
  backHref,
  backLabel = "Back",
  breadcrumbs,
  context,
  notFound = false,
}: SectionDetailViewProps): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("students");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (notFound || !section) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground not-interactive">
          Section not found.
        </p>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "students", label: "Students", icon: <Users className="h-3.5 w-3.5" /> },
    { key: "classes", label: "Classes", icon: <BookOpen className="h-3.5 w-3.5" /> },
    { key: "schedule", label: "Weekly Schedule", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={section.name}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Cap. {section.capacity}
            </Badge>
            <button
              onClick={() => router.push(backHref)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <ChevronLeft className="h-3 w-3" />
              {backLabel}
            </button>
          </div>
        }
      />

      {context && context.length > 0 && (
        <div className="rounded-lg border bg-card divide-y divide-border">
          {context.map((row) => (
            <div key={row.label} className="flex items-center gap-6 px-6 py-3">
              <span className="w-32 text-sm text-muted-foreground shrink-0 not-interactive">
                {row.label}
              </span>
              <div className="text-sm text-foreground">{row.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium",
                "-mb-px border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex items-center pr-4">
            <Layers className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
            <span className="text-xs text-muted-foreground not-interactive">
              Section
            </span>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === "students" && (
            <StudentsTab section={section} schoolYearId={schoolYearId} isEnded={isEnded} />
          )}
          {activeTab === "classes" && (
            <ClassesTab section={section} schoolYearId={schoolYearId} />
          )}
          {activeTab === "schedule" && (
            <WeeklyScheduleTab section={section} schoolYearId={schoolYearId} />
          )}
        </div>
      </div>
    </div>
  );
}