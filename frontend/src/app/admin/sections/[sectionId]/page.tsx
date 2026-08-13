"use client";

// frontend/src/app/admin/sections/[sectionId]/page.tsx
// Dedicated section detail page for the admin Sections area. More detailed than
// the program-context view: it shows the full context path (School Year →
// Program → Course/Strand → Level) alongside the students/classes/schedule tabs.

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { useSectionContext } from "@/hooks/admin/useSectionContext";
import { SectionDetailView } from "@/components/admin/section/SectionDetailView";
import { Badge } from "@/components/ui/badge";

export default function SectionDetailPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}): React.JSX.Element {
  const { sectionId } = use(params);
  const searchParams = useSearchParams();
  const urlSchoolYearId = searchParams.get("schoolYearId");

  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();

  const [schoolYearId, setSchoolYearId] = useState<string | null>(
    urlSchoolYearId || null,
  );

  useEffect(() => {
    if (!schoolYearId && schoolYears.length > 0) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSchoolYearId(urlSchoolYearId ?? active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, schoolYearId, urlSchoolYearId]);

  const { section, isLoading, level, program, course, strand, schoolYearName } =
    useSectionContext(schoolYearId, sectionId);

  const breadcrumbs = [
    { label: "Admin" },
    { label: "Sections", href: "/admin/sections" },
    { label: section?.name ?? "Section" },
  ];

  const context = [
    { label: "School Year", value: schoolYearName || "—" },
    { label: "Department", value: program?.name ?? "—" },
    {
      label: "Course",
      value: course ? (course.code ? `${course.code} — ${course.name}` : course.name) : "—",
    },
    { label: "Strand", value: strand?.name ?? "—" },
    { label: "Level", value: level?.name ?? "—" },
    {
      label: "Capacity",
      value: (
        <Badge variant="secondary" className="text-xs">
          Cap. {section?.capacity ?? 0}
        </Badge>
      ),
    },
  ];

  return (
    <SectionDetailView
      section={section}
      schoolYearId={schoolYearId ?? ""}
      isLoading={syLoading || isLoading}
      isEnded={false}
      backHref="/admin/sections"
      backLabel="Back to Sections"
      breadcrumbs={breadcrumbs}
      context={context}
    />
  );
}