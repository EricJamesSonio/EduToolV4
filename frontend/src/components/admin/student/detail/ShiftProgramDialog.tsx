"use client";

import { useMemo, useState } from "react";
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
  const showCourseSelect = selectedProgram?.type === "college" && (selectedProgram.courses?.length ?? 0) > 0;
  const showStrandSelect = selectedProgram?.type === "shs" && (selectedProgram.strands?.length ?? 0) > 0;

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
          Shifting is within the same school year and same department. Previous classes will be marked removed with the default outcome. Only <span className="font-medium">SHS and College</span> use course/strand, others are per-level only (e.g. Grade 5 → Grade 6).
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
              {currentProgram && <p className="text-xs text-muted-foreground">Current: {currentProgram.name} · {currentProgram.type}</p>}
            </div>

            {showCourseSelect && selectedProgram && (
              <div className="space-y-1.5">
                <Label>Target Course {selectedProgram.type === "college" ? "*" : ""}</Label>
                <Select value={toCourseId} onValueChange={(v) => setToCourseId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course (e.g. BSCS → BSA)" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProgram.courses!.map((c) => (
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
                    {selectedProgram.strands!.map((s) => (
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
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleShift} disabled={shift.isPending || !toProgramId || !toLevelId || eligiblePrograms.length === 0}>Confirm Shift</Button>
      </ModalFooter>
    </Modal>
  );
}
