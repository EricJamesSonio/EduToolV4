"use client";

import { use } from "react";
import { useProgramDetail } from "@/hooks/admin/useProgram";
import { ProgramUnitDetailView } from "@/components/admin/program/ProgramUnitDetailView";

export default function StrandDetailPage({
  params,
}: {
  params: Promise<{ id: string; strandId: string }>;
}): React.JSX.Element {
  const { id, strandId } = use(params);
  const { data: program, isLoading } = useProgramDetail(id);

  return (
    <ProgramUnitDetailView
      kind="strand"
      unitId={strandId}
      program={program}
      isLoading={isLoading}
    />
  );
}