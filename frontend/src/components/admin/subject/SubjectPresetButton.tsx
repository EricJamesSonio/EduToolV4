"use client";

import { useEffect, useState } from "react";
import { Pin, Settings2 } from "lucide-react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { levelApi } from "@/api/admin/level.api";
import { useScheduleWindow } from "@/hooks/shared/useScheduleWindow";
import type { Program } from "@/types/admin/program.types";
import type { Level } from "@/types/admin/level.types";
import type { SubjectPreset, SubjectPresetData } from "@/hooks/admin/useSubjectPreset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalBody, ModalFooter } from "@/components/shared/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Sentinel for "use the department default" (Base UI items can't be ""). */
const DEFAULT_OPTION = "default";

interface SubjectPresetButtonProps {
  schoolYearId: string;
  programs: Program[];
  preset: SubjectPreset | null;
  savePreset: (data: SubjectPresetData) => void;
  setEnabled: (enabled: boolean) => void;
  clearPreset: () => void;
}

export function SubjectPresetButton({
  schoolYearId,
  programs,
  preset,
  savePreset,
  setEnabled,
  clearPreset,
}: SubjectPresetButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [strandId, setStrandId] = useState("");
  const [levelId, setLevelId] = useState("");
  // Empty string = Default
  const [sessionsPerWeek, setSessionsPerWeek] = useState("");
  const [sessionHours, setSessionHours] = useState("");
  const [sessionMins, setSessionMins] = useState("");

  const { stepMin: slotMinutes } = useScheduleWindow();

  // Load the current preset into the picker whenever it's opened
  useEffect(() => {
    if (!open) return;
    setProgramId(preset?.programId ?? "");
    setCourseId(preset?.courseId ?? "");
    setStrandId(preset?.strandId ?? "");
    setLevelId(preset?.levelId ?? "");
    setSessionsPerWeek(
      preset?.sessionsPerWeek != null ? String(preset.sessionsPerWeek) : "",
    );
    setSessionHours(
      preset?.sessionMinutes != null
        ? String(Math.floor(preset.sessionMinutes / 60))
        : "",
    );
    setSessionMins(
      preset?.sessionMinutes != null ? String(preset.sessionMinutes % 60) : "",
    );
  }, [open, preset]);

  const selectedProgram = programs.find((p) => p.id === programId);
  const programType = selectedProgram?.type ?? "";
  const hasCourses = programType === "college";
  const hasStrands = programType === "shs";
  // Departments like Elementary / JHS / Kinder / Daycare: levels belong to the
  // program directly (no course or strand).
  const hasPlainLevels = !!programId && !hasCourses && !hasStrands;

  const { data: courseLevels = [] } = useAsyncQuery(
    [...queryKeys.admin.levels.all, "preset-course", schoolYearId, courseId] as const,
    () => levelApi.getByCourse(schoolYearId, courseId),
    { enabled: hasCourses && !!courseId },
  );

  const { data: strandLevels = [] } = useAsyncQuery(
    [...queryKeys.admin.levels.all, "preset-strand", schoolYearId, strandId] as const,
    () => levelApi.getByStrand(schoolYearId, strandId),
    { enabled: hasStrands && !!strandId },
  );

  const { data: programLevels = [] } = useAsyncQuery(
    [...queryKeys.admin.levels.all, "preset-program", schoolYearId, programId] as const,
    () => levelApi.getBySchoolYear(schoolYearId, programId),
    { enabled: hasPlainLevels },
  );

  const availableLevels: Level[] = hasCourses
    ? courseLevels
    : hasStrands
      ? strandLevels
      : hasPlainLevels
        ? programLevels
        : [];

  // Session length: both empty = Default, otherwise hours + minutes collapse
  // to one total that must match the school's slot length (same rules as the
  // New Subject form).
  const sessionTotalMinutes =
    sessionHours === "" && sessionMins === ""
      ? null
      : (Number(sessionHours) || 0) * 60 + (Number(sessionMins) || 0);

  const sessionError: string | null = (() => {
    if (sessionHours !== "" && !(/^\d+$/.test(sessionHours) && Number(sessionHours) <= 8)) {
      return "Hours must be 0–8.";
    }
    if (sessionMins !== "" && !(/^\d+$/.test(sessionMins) && Number(sessionMins) <= 59)) {
      return "Minutes must be 0–59.";
    }
    if (sessionTotalMinutes == null) return null;
    if (sessionTotalMinutes < 5) {
      return "Enter at least 5 minutes, or leave both empty for Default.";
    }
    if (sessionTotalMinutes > 480) {
      return "Session length cannot exceed 480 minutes (8h).";
    }
    if (sessionTotalMinutes % slotMinutes !== 0) {
      return `${sessionTotalMinutes}m is not a multiple of the school's ${slotMinutes}m slot length.`;
    }
    return null;
  })();

  const canSet =
    !!programId &&
    (hasCourses ? !!courseId : hasStrands ? !!strandId : true) &&
    !!levelId &&
    !sessionError;

  const handleSet = () => {
    savePreset({
      programId,
      courseId: hasCourses ? courseId : null,
      strandId: hasStrands ? strandId : null,
      levelId,
      sessionsPerWeek: sessionsPerWeek ? Number(sessionsPerWeek) : null,
      sessionMinutes: sessionTotalMinutes,
    });
    setOpen(false);
  };

  const handleClear = () => {
    clearPreset();
    setProgramId("");
    setCourseId("");
    setStrandId("");
    setLevelId("");
    setSessionsPerWeek("");
    setSessionHours("");
    setSessionMins("");
    setOpen(false);
  };

  const presetProgramName = preset
    ? (programs.find((p) => p.id === preset.programId)?.name ?? "Preset")
    : null;

  const levelPlaceholder = !programId
    ? "Select a department first"
    : hasCourses && !courseId
      ? "Select a course first"
      : hasStrands && !strandId
        ? "Select a strand first"
        : "Select a level";

  return (
    <>
      <Button
        type="button"
        variant={preset?.enabled ? "default" : "outline"}
        size="sm"
        onClick={() => setOpen(true)}
        className={preset?.enabled ? "" : "border-primary text-primary hover:bg-primary/10"}
      >
        {preset?.enabled ? (
          <Pin className="mr-1.5 h-3.5 w-3.5" />
        ) : (
          <Settings2 className="mr-1.5 h-3.5 w-3.5" />
        )}
        {preset
          ? preset.enabled
            ? `Preset: ${presetProgramName}`
            : "Preset (off)"
          : "Set Preset"}
      </Button>

      {open && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Subject Preset"
          description="Pick a department, course/strand, level, and weekly sessions. New Subject will auto-fill with these until you turn the preset off or change it."
          size="md"
        >
          <ModalBody>
            <div className="space-y-4">
              {preset && (
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Preset status</p>
                    <p className="text-xs text-muted-foreground">
                      {preset.enabled
                        ? "New Subject auto-fills with this preset."
                        : "Preset is off — New Subject opens blank."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEnabled(!preset.enabled)}
                  >
                    {preset.enabled ? "Turn Off" : "Turn On"}
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={programId}
                  onValueChange={(v) => {
                    setProgramId(v ?? "");
                    setCourseId("");
                    setStrandId("");
                    setLevelId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department">
                      {programs.find((p) => p.id === programId)?.name ?? "Select a department"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasCourses && (
                <div className="space-y-1.5">
                  <Label>Course</Label>
                  <Select
                    value={courseId}
                    onValueChange={(v) => {
                      setCourseId(v ?? "");
                      setLevelId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course">
                        {selectedProgram?.courses?.find((c) => c.id === courseId)?.name ??
                          "Select a course"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProgram?.courses?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {hasStrands && (
                <div className="space-y-1.5">
                  <Label>Strand</Label>
                  <Select
                    value={strandId}
                    onValueChange={(v) => {
                      setStrandId(v ?? "");
                      setLevelId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a strand">
                        {selectedProgram?.strands?.find((s) => s.id === strandId)?.name ??
                          "Select a strand"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProgram?.strands?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select
                  value={levelId}
                  onValueChange={(v) => setLevelId(v ?? "")}
                  disabled={!programId || (hasCourses && !courseId) || (hasStrands && !strandId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={levelPlaceholder}>
                      {availableLevels.find((l) => l.id === levelId)?.name ?? levelPlaceholder}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Weekly sessions — optional, Default follows the department standard */}
              <div className="space-y-1.5">
                <Label>Weekly sessions</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={sessionsPerWeek || DEFAULT_OPTION}
                    onValueChange={(v) =>
                      setSessionsPerWeek(v === DEFAULT_OPTION ? "" : (v ?? ""))
                    }
                  >
                    <SelectTrigger aria-label="Sessions per week">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_OPTION}>Default</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} per week
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    step={1}
                    placeholder="Hours"
                    aria-label="Session hours"
                    value={sessionHours}
                    onChange={(e) => setSessionHours(e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    step={1}
                    placeholder="Minutes"
                    aria-label="Session minutes"
                    value={sessionMins}
                    onChange={(e) => setSessionMins(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Leave everything on Default to follow the department standard.
                  Length must be a multiple of the school&apos;s {slotMinutes}m slot.
                  {sessionTotalMinutes != null && sessionTotalMinutes > 0
                    ? ` Current: ${sessionTotalMinutes}m.`
                    : ""}
                </p>
                {sessionError && (
                  <p className="text-xs text-destructive">{sessionError}</p>
                )}
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            {preset && (
              <Button type="button" variant="outline" onClick={handleClear}>
                Clear Preset
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSet} disabled={!canSet}>
              Set Preset
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}