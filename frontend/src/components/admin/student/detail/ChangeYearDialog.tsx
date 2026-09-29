"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { levelApi } from "@/api/admin/level.api";
import { sectionApi } from "@/api/admin/section.api";
import { useChangeYear } from "@/hooks/admin/useProgramShift";

interface Props {
  open: boolean;
  onClose: () => void;
  schoolYearId: string;
  studentSchoolYearId: string;
  currentProgramName?: string;
  currentCourseName?: string | null;
  currentStrandName?: string | null;
  currentLevelId?: string | null;
  currentLevelName?: string | null;
  currentCourseId?: string | null;
  currentStrandId?: string | null;
  currentProgramId?: string;
}

export function ChangeYearDialog({
  open,
  onClose,
  schoolYearId,
  studentSchoolYearId,
  currentProgramName,
  currentCourseName,
  currentStrandName,
  currentLevelId,
  currentLevelName,
  currentCourseId,
  currentStrandId,
  currentProgramId,
}: Props): React.JSX.Element {
  const [toLevelId, setToLevelId] = useState<string>("");
  const [toSectionId, setToSectionId] = useState<string>("");
  const changeYear = useChangeYear(schoolYearId, studentSchoolYearId);

  useEffect(() => {
    if (open) {
      setToLevelId("");
      setToSectionId("");
    }
  }, [open, schoolYearId, studentSchoolYearId]);

  const { data: levelsRaw, isLoading } = useAsyncQuery(
    ["admin", "levels", "change-year", schoolYearId, currentProgramId, currentCourseId, currentStrandId] as unknown as readonly unknown[],
    () => {
      if (currentCourseId) return levelApi.getByCourse(schoolYearId, currentCourseId);
      if (currentStrandId) return levelApi.getByStrand(schoolYearId, currentStrandId);
      return levelApi.getBySchoolYear(schoolYearId, currentProgramId);
    },
    { enabled: open && !!schoolYearId },
  );

  const levels = useMemo(
    () => (levelsRaw as { id: string; name: string }[] | undefined) ?? [],
    [levelsRaw],
  );
  const eligibleLevels = useMemo(
    () => levels.filter((l) => l.id !== (currentLevelId ?? "")),
    [levels, currentLevelId],
  );

  const { data: sectionsRaw } = useAsyncQuery(
    ["admin", "sections", "change-year", schoolYearId, toLevelId] as unknown as readonly unknown[],
    () => sectionApi.getAll(schoolYearId, toLevelId || undefined, currentCourseId || undefined, currentStrandId || undefined),
    { enabled: open && !!toLevelId },
  );
  const sections = useMemo(
    () => (sectionsRaw as { id: string; name: string; capacity: number }[] | undefined) ?? [],
    [sectionsRaw],
  );
  const selectedLevelLabel = levels.find((l) => l.id === toLevelId)?.name ?? null;
  const selectedSectionLabel = toSectionId
    ? (sections.find((s) => s.id === toSectionId)?.name ?? null)
    : "No section yet";

  const handleConfirm = (): void => {
    if (!toLevelId) {
      toast.error("Select target year / level");
      return;
    }
    if (toLevelId === (currentLevelId ?? "")) {
      toast.error("Select a different year from the current program");
      return;
    }
    changeYear.mutate(
      { levelId: toLevelId, ...(toSectionId ? { sectionId: toSectionId } : {}) } as never,
      {
        onSuccess: () => {
          toast.success("Year level changed");
          onClose();
        },
        onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to change year"),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Change Year" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Move year levels within the <span className="font-medium">same program</span> and same school year
          (e.g. 1st year → 3rd year). Previous classes will be marked removed with the default outcome.
        </p>
        <p className="text-xs text-muted-foreground">
          Current: {currentProgramName ?? "Program"}
          {currentCourseName ? ` · ${currentCourseName}` : ""}
          {currentStrandName ? ` · ${currentStrandName}` : ""}
          {currentLevelName ? ` · ${currentLevelName}` : ""}
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading year levels…</p>
        ) : eligibleLevels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other year levels in this program.</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Target Year / Level *</Label>
              <Select value={toLevelId} onValueChange={(v) => { setToLevelId(v ?? ""); setToSectionId(""); }}>
                <SelectTrigger>
                  {selectedLevelLabel ? (
                    <span className="flex flex-1 truncate text-left">{selectedLevelLabel}</span>
                  ) : (
                    <SelectValue placeholder="Select year (e.g. 1st → 3rd year)" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {eligibleLevels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {toLevelId && (
              <div className="space-y-1.5">
                <Label>Section (optional — No section is default)</Label>
                <Select value={toSectionId} onValueChange={(v) => setToSectionId(v ?? "")}>
                  <SelectTrigger>
                    {selectedSectionLabel ? (
                      <span className="flex flex-1 truncate text-left">{selectedSectionLabel}</span>
                    ) : (
                      <SelectValue placeholder="No section yet" />
                    )}
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
              </div>
            )}
          </>
        )}
      </div>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={changeYear.isPending || !toLevelId || eligibleLevels.length === 0}>
          Confirm Change
        </Button>
      </ModalFooter>
    </Modal>
  );
}
