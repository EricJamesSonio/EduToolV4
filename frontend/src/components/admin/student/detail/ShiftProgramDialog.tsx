"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { programApi } from "@/api/admin/program.api";
import { levelApi } from "@/api/admin/level.api";
import { sectionApi } from "@/api/admin/section.api";
import { useProgramShift } from "@/hooks/admin/useProgramShift";
import type { Program } from "@/types/admin/program.types";

interface Props {
  open: boolean;
  onClose: () => void;
  schoolYearId: string;
  studentSchoolYearId: string;
  currentProgramId?: string;
  currentCourseId?: string | null;
  currentStrandId?: string | null;
  currentLevelId?: string | null;
}

export function ShiftProgramDialog({
  open,
  onClose,
  schoolYearId,
  studentSchoolYearId,
  currentProgramId,
  currentCourseId,
  currentStrandId,
  currentLevelId,
}: Props): React.JSX.Element {
  const [toProgramId, setToProgramId] = useState<string>("");
  const [toCourseId, setToCourseId] = useState<string>("");
  const [toStrandId, setToStrandId] = useState<string>("");
  const [toLevelId, setToLevelId] = useState<string>("");
  const [toSectionId, setToSectionId] = useState<string>("");
  const shift = useProgramShift(schoolYearId, studentSchoolYearId);

  // Reset stale selections every time the dialog opens so the trigger never
  // renders a raw UUID value before options have loaded.
  useEffect(() => {
    if (open) {
      setToProgramId("");
      setToCourseId("");
      setToStrandId("");
      setToLevelId("");
      setToSectionId("");
    }
  }, [open, schoolYearId, studentSchoolYearId]);

  const { data: programsRaw, isLoading } = useAsyncQuery(
    ["admin", "programs", schoolYearId] as unknown as readonly unknown[],
    () => programApi.getAll(schoolYearId),
    { enabled: open && !!schoolYearId },
  );

  const programs: Program[] = useMemo(() => (programsRaw as Program[] | undefined) ?? [], [programsRaw]);

  const currentProgram = programs.find((p) => p.id === currentProgramId) ?? null;
  const isCollege = currentProgram?.type === "college";
  const isShs = currentProgram?.type === "shs";

  const eligiblePrograms = useMemo(() => {
    if (!currentProgram) return programs;
    return programs.filter((p) => p.type === currentProgram.type);
  }, [programs, currentProgram]);

  const selectedProgram = programs.find((p) => p.id === toProgramId) ?? null;
  const selectedProgramLabel = selectedProgram
    ? `${selectedProgram.name} · ${selectedProgram.type}`
    : null;
  const showCourseSelect = selectedProgram?.type === "college" && (selectedProgram.courses?.length ?? 0) > 0;
  const showStrandSelect = selectedProgram?.type === "shs" && (selectedProgram.strands?.length ?? 0) > 0;

  const currentCourseName =
    currentProgram?.courses?.find((c) => c.id === currentCourseId)?.name ?? null;
  const currentStrandName =
    currentProgram?.strands?.find((s) => s.id === currentStrandId)?.name ?? null;

  // Shift = different course/strand (or different program). Hide the current
  // course/strand option so the same placement can't be picked.
  const isSameProgram = !!selectedProgram && !!currentProgram && selectedProgram.id === currentProgram.id;
  const courseOptions = (selectedProgram?.courses ?? []).filter(
    (c) => !(isSameProgram && c.id === currentCourseId),
  );
  const strandOptions = (selectedProgram?.strands ?? []).filter(
    (s) => !(isSameProgram && s.id === currentStrandId),
  );
  const sameCourseStrandBlocked =
    isSameProgram &&
    (selectedProgram?.type === "college"
      ? (toCourseId || "") === (currentCourseId ?? "")
      : selectedProgram?.type === "shs"
        ? (toStrandId || "") === (currentStrandId ?? "")
        : true);
  void selectedProgramLabel;

  // Levels for selected program/course/strand
  const { data: levelsRaw } = useAsyncQuery(
    ["admin", "levels", schoolYearId, toProgramId, toCourseId, toStrandId] as unknown as readonly unknown[],
    () => {
      if (!toProgramId) return Promise.resolve([] as never);
      if (toCourseId) return levelApi.getByCourse(schoolYearId, toCourseId);
      if (toStrandId) return levelApi.getByStrand(schoolYearId, toStrandId);
      return levelApi.getBySchoolYear(schoolYearId, toProgramId);
    },
    { enabled: open && !!toProgramId },
  );

  const levels = useMemo(() => (levelsRaw as { id: string; name: string }[] | undefined) ?? [], [levelsRaw]);

  const { data: sectionsRaw } = useAsyncQuery(
    ["admin", "sections", schoolYearId, toLevelId, toCourseId, toStrandId] as unknown as readonly unknown[],
    () => sectionApi.getAll(schoolYearId, toLevelId || undefined, toCourseId || undefined, toStrandId || undefined),
    { enabled: open && !!toLevelId },
  );

  const sections = useMemo(() => (sectionsRaw as { id: string; name: string; capacity: number }[] | undefined) ?? [], [sectionsRaw]);

  const handleShift = () => {
    if (!toProgramId) {
      toast.error("Select target program");
      return;
    }
    if (!toLevelId) {
      toast.error("Target year/level is required");
      return;
    }
    const samePlacement =
      toProgramId === currentProgramId &&
      (toCourseId || "") === (currentCourseId ?? "") &&
      (toStrandId || "") === (currentStrandId ?? "") &&
      toLevelId === (currentLevelId ?? "");
    if (samePlacement) {
      toast.error("Select a different program, course, strand or year to shift");
      return;
    }
    // Shift requires a different course/strand when staying in the same
    // program — same course/strand + new year belongs to Change Year.
    if (
      toProgramId === currentProgramId &&
      (toCourseId || "") === (currentCourseId ?? "") &&
      (toStrandId || "") === (currentStrandId ?? "")
    ) {
      toast.error("Same course/strand — use Change Year to move year levels instead.");
      return;
    }
    if (selectedProgram?.type === "college" && !toCourseId) {
      toast.error("Select a different target course");
      return;
    }
    if (selectedProgram?.type === "shs" && !toStrandId) {
      toast.error("Select a different target strand");
      return;
    }

    const payload: { toProgramId: string; levelId: string; courseId?: string; strandId?: string; sectionId?: string } = {
      toProgramId,
      levelId: toLevelId,
    };
    if (toCourseId) payload.courseId = toCourseId;
    if (toStrandId) payload.strandId = toStrandId;
    if (toSectionId) payload.sectionId = toSectionId;

    shift.mutate(payload as never, {
      onSuccess: () => {
        toast.success("Program shifted");
        onClose();
      },
      onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to shift"),
    });
  };

  const handleProgramChange = (v: string) => {
    setToProgramId(v ?? "");
    setToCourseId("");
    setToStrandId("");
    setToLevelId("");
    setToSectionId("");
  };

  return (
    <Modal open={open} onClose={onClose} title="Shift Program" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Shift to a <span className="font-medium">different course/strand or program</span> within the same school year and same department. Previous classes will be marked removed with the default outcome. To move year levels in the <span className="font-medium">same</span> course/strand (e.g. 1st → 3rd year), use <span className="font-medium">Change Year</span> instead.
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading programs…</p>
        ) : eligiblePrograms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other programs available in this department for this school year.</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Target Program *</Label>
              <Select value={toProgramId} onValueChange={(v) => handleProgramChange(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {eligiblePrograms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} <span className="text-xs text-muted-foreground ml-2">· {p.type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentProgram && (
                <p className="text-xs text-muted-foreground">
                  Current: {currentProgram.name} · {currentProgram.type}
                  {currentCourseName ? ` · ${currentCourseName}` : ""}
                  {currentStrandName ? ` · ${currentStrandName}` : ""}
                </p>
              )}
            </div>

            {showCourseSelect && selectedProgram && (
              <div className="space-y-1.5">
                <Label>Target Course {selectedProgram.type === "college" ? "*" : ""}</Label>
                <Select value={toCourseId} onValueChange={(v) => setToCourseId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course (e.g. BSCS → BSA)" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions.length === 0 ? (
                      <SelectItem value="__none" disabled>No other course available — use Change Year</SelectItem>
                    ) : null}
                    {courseOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code ? `${c.code} – ${c.name}` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showStrandSelect && selectedProgram && (
              <div className="space-y-1.5">
                <Label>Target Strand {selectedProgram.type === "shs" ? "*" : ""}</Label>
                <Select value={toStrandId} onValueChange={(v) => setToStrandId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strand (e.g. HUMSS → ABM)" />
                  </SelectTrigger>
                  <SelectContent>
                    {strandOptions.length === 0 ? (
                      <SelectItem value="__none" disabled>No other strand available — use Change Year</SelectItem>
                    ) : null}
                    {strandOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {toProgramId && (
              <div className="space-y-1.5">
                <Label>Target Year / Level *</Label>
                <Select value={toLevelId} onValueChange={(v) => setToLevelId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year (e.g. BSA 1, Grade 6)" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.length === 0 ? <SelectItem value="__none" disabled>No levels found</SelectItem> : null}
                    {levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {toLevelId && (
              <div className="space-y-1.5">
                <Label>Section (optional — No section is default)</Label>
                <Select value={toSectionId} onValueChange={(v) => setToSectionId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="No section yet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No section yet</SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · cap {s.capacity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">If assigned, it will be saved in academic history as usual.</p>
              </div>
            )}
          </>
        )}
      </div>
      {sameCourseStrandBlocked && toProgramId && (
        <p className="text-xs text-amber-600">
          Same course/strand selected — pick a different course/strand, or use Change Year for year moves.
        </p>
      )}
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleShift}
          disabled={shift.isPending || !toProgramId || !toLevelId || eligiblePrograms.length === 0 || sameCourseStrandBlocked}
        >
          Confirm Shift
        </Button>
      </ModalFooter>
    </Modal>
  );
}
