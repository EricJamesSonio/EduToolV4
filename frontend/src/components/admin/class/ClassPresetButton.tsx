"use client";

import { useEffect, useState } from "react";
import { Pin, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal, ModalBody, ModalFooter } from "@/components/shared/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useCreateClassData } from "./hooks/useCreateClassData";
import type { ClassPreset, ClassPresetData } from "@/hooks/admin/useClassPreset";

interface ClassPresetButtonProps {
  schoolYearId: string;
  preset: ClassPreset | null;
  savePreset: (data: ClassPresetData) => void;
  setEnabled: (enabled: boolean) => void;
  clearPreset: () => void;
}

export function ClassPresetButton({
  schoolYearId,
  preset,
  savePreset,
  setEnabled,
  clearPreset,
}: ClassPresetButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [programId, setProgramId]   = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [trackId, setTrackId]       = useState("");
  const [levelId, setLevelId]       = useState("");
  const [sectionId, setSectionId]   = useState("");

  // Load the current preset into the picker whenever it's opened
  useEffect(() => {
    if (!open) return;
    setProgramId(preset?.programId ?? "");
    setSemesterId(preset?.semesterId ?? "");
    setTrackId(preset?.trackId ?? "");
    setLevelId(preset?.levelId ?? "");
    setSectionId(preset?.sectionId ?? "");
  }, [open, preset]);

  const {
    programs, tracks, hasTrack, isCourseTrack, levels, sections,
    programMissingTemplate, semesters,
  } = useCreateClassData(schoolYearId, programId, semesterId, trackId, levelId, open);

  // These only fire from real picks made inside this modal — never from the
  // initial population of an existing preset — since they're plain state
  // setters in onValueChange, not a watch-based effect.
  const handleProgramChange = (v: string | null) => {
    setProgramId(v ?? "");
    setSemesterId("");
    setTrackId("");
    setLevelId("");
    setSectionId("");
  };
  const handleSemesterChange = (v: string | null) => {
    setSemesterId(v ?? "");
    setTrackId("");
    setLevelId("");
    setSectionId("");
  };
  const handleTrackChange = (v: string | null) => {
    setTrackId(v ?? "");
    setLevelId("");
    setSectionId("");
  };
  const handleLevelChange = (v: string | null) => {
    setLevelId(v ?? "");
    setSectionId("");
  };

  const canSet =
    !!programId &&
    !!semesterId &&
    (hasTrack ? !!trackId : true) &&
    !!levelId &&
    !!sectionId;

  const handleSet = () => {
    savePreset({ programId, semesterId, trackId, levelId, sectionId });
    setOpen(false);
  };

  const handleClear = () => {
    clearPreset();
    setProgramId("");
    setSemesterId("");
    setTrackId("");
    setLevelId("");
    setSectionId("");
    setOpen(false);
  };

  const presetProgramName = preset
    ? (programs.find((p) => p.id === preset.programId)?.name ?? "Preset")
    : null;

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
          title="Class Preset"
          description="Pick a department, semester, course/strand, level, and section. New Class will auto-fill with these until you turn the preset off or change it. Educator and schedule are never preset since those change per class."
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
                        ? "New Class auto-fills with this preset."
                        : "Preset is off — New Class opens blank."}
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
                <Select value={programId} onValueChange={handleProgramChange}>
                  <SelectTrigger>
                    <span>{programs.find((p) => p.id === programId)?.name ?? "Select department"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select
                  value={semesterId}
                  onValueChange={handleSemesterChange}
                  disabled={!programId || programMissingTemplate}
                >
                  <SelectTrigger>
                    <span>
                      {!programId
                        ? "Select a department first"
                        : programMissingTemplate
                          ? "No template assigned"
                          : (semesters.find((s) => s.id === semesterId)?.name ?? "Select semester")}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No semesters for this department
                      </div>
                    ) : (
                      semesters.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {hasTrack && (
                <div className="space-y-1.5">
                  <Label>{isCourseTrack ? "Course" : "Strand"}</Label>
                  <Select
                    value={trackId}
                    onValueChange={handleTrackChange}
                    disabled={!semesterId}
                  >
                    <SelectTrigger>
                      <span>
                        {!semesterId
                          ? "Select a semester first"
                          : (tracks.find((t) => t.id === trackId)?.name ??
                            `Select ${isCourseTrack ? "course" : "strand"}`)}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select
                  value={levelId}
                  onValueChange={handleLevelChange}
                  disabled={!semesterId || (hasTrack && !trackId)}
                >
                  <SelectTrigger>
                    <span>{levels.find((l) => l.id === levelId)?.name ?? "Select level"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {levels.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No levels found</div>
                    ) : (
                      levels.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Section</Label>
                <Select
                  value={sectionId}
                  onValueChange={(v) => setSectionId(v ?? "")}
                  disabled={!levelId}
                >
                  <SelectTrigger>
                    <span>{sections.find((s) => s.id === sectionId)?.name ?? "Select section"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {sections.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No sections for this level
                      </div>
                    ) : (
                      sections.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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