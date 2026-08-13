"use client";

// frontend/src/app/admin/programs/[id]/sections/[sectionId]/page.tsx
// Section detail page shown within the context of a program. Clicking a section
// on the program detail page navigates here; a back link returns to the program.

import { use } from "react";
import { useProgramDetail } from "@/hooks/admin/useProgram";
import { useSectionContext } from "@/hooks/admin/useSectionContext";
import { SectionDetailView } from "@/components/admin/section/SectionDetailView";
import { Badge } from "@/components/ui/badge";

export default function ProgramSectionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>;
}): React.JSX.Element {
  const { id: programId, sectionId } = use(params);

  const { data: program, isLoading: programLoading } = useProgramDetail(programId);

  const { section, isLoading, level, schoolYearName } = useSectionContext(
    program?.schoolYearId ?? null,
    sectionId,
  );

  const breadcrumbs = [
    { label: "Admin" },
    { label: "Departments", href: "/admin/programs" },
    { label: program?.name ?? "Department", href: `/admin/programs/${programId}` },
    { label: section?.name ?? "Section" },
  ];

  return (
    <SectionDetailView
      section={section}
      schoolYearId={program?.schoolYearId ?? ""}
      isLoading={programLoading || isLoading}
      isEnded={false}
      backHref={`/admin/programs/${programId}`}
      backLabel={`Back to ${program?.name ?? "department"}`}
      breadcrumbs={breadcrumbs}
      context={[
        { label: "Department", value: program?.name ?? "—" },
        { label: "Level", value: level?.name ?? "—" },
        { label: "School Year", value: schoolYearName || "—" },
        {
          label: "Capacity",
          value: (
            <Badge variant="secondary" className="text-xs">
              Cap. {section?.capacity ?? 0}
            </Badge>
          ),
        },
      ]}
    />
  );
}