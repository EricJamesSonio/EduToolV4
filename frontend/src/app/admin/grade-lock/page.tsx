"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Lock, Settings, Layers, Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { GradeLockHierarchyFilter } from "@/components/admin/grade-lock/GradeLockHierarchyFilter";
import { GradeLockSettingModal } from "@/components/admin/grade-lock/GradeLockSettingModal";
import { GradeLockOverrideDialog } from "@/components/admin/grade-lock/GradeLockOverrideDialog";
import { GradeLockStats } from "@/components/admin/grade-lock/GradeLockStats";

import { useGradeLockColumns } from "@/hooks/admin/useGradeLockColumns";
import {
  useGradeLocks,
  useGradeLockSettings,
  useAssignSetting,
} from "@/hooks/admin/useGradeLocks";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";

import type { GradeLock } from "@/types/admin/grade-lock.types";

export default function GradeLockPage(): React.ReactElement {
  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const { mutate: assignSetting, isPending: isApplying } = useAssignSetting();

  const [overrideTarget, setOverrideTarget] = useState<GradeLock | null>(null);
  const [applyTarget, setApplyTarget] = useState<GradeLock | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<
    string | null
  >(null);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedCourseStrand, setSelectedCourseStrand] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [editTarget, setEditTarget] = useState<GradeLockSetting | null>(null);
  const { data: schoolYears, isLoading: schoolYearsLoading } = useSchoolYears();
  const { data: gradeLocks, isLoading } = useGradeLocks(
    selectedSchoolYearId ?? undefined,
  );
  const { data: settings } = useGradeLockSettings();

  const locks = useMemo(
    () => (Array.isArray(gradeLocks) ? gradeLocks : []),
    [gradeLocks],
  );

  const settingMap = useMemo(() => {
    if (!settings) return new Map<string, string>();
    return new Map(settings.map((s) => [s.id, s.name]));
  }, [settings]);

  const templates = useMemo(
    () => (Array.isArray(settings) ? settings : []),
    [settings],
  );

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.is_default) ?? templates[0] ?? null;
  }, [templates]);

  const handleApplyTemplate = (lock: GradeLock) => {
    setSelectedTemplateId(activeTemplate?.id ?? templates[0]?.id ?? "");
    setApplyTarget(lock);
  };

  const handleOverride = (lock: GradeLock) => {
    setOverrideTarget(lock);
  };

  const columns = useGradeLockColumns(
    handleOverride,
    handleApplyTemplate,
    settingMap,
  );

  const filteredLocks = useMemo(() => {
    let result = locks;

    if (selectedSchoolYearId) {
      result = result.filter(
        (lock) => lock.class?.school_year_id === selectedSchoolYearId,
      );
    }

    if (selectedProgram) {
      result = result.filter(
        (lock) =>
          lock.class?.program_id === selectedProgram ||
          lock.class?.subject?.program_id === selectedProgram,
      );
    }

    if (selectedCourseStrand) {
      result = result.filter(
        (lock) =>
          lock.class?.subject?.course_id === selectedCourseStrand ||
          lock.class?.subject?.strand_id === selectedCourseStrand,
      );
    }

    if (selectedLevel) {
      result = result.filter(
        (lock) => lock.class?.subject?.level_id === selectedLevel,
      );
    }

    return result;
  }, [
    locks,
    selectedSchoolYearId,
    selectedProgram,
    selectedCourseStrand,
    selectedLevel,
  ]);

  const handleSchoolYearSelect = (id: string | null) => {
    setSelectedSchoolYearId(id);
    setSelectedProgram("");
    setSelectedCourseStrand("");
    setSelectedLevel("");
  };

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  return (
    <div className="space-y-8 p-6">
      {/* ================= HEADER ================= */}
      <PageHeader
        title="Grade Lock System"
        description="Manage reusable lock templates and apply them to classes."
        actions={
          <Button onClick={() => setSettingModalOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Manage Templates
          </Button>
        }
      />

      {/* ================= GLOBAL TEMPLATES ================= */}
      {/* ================= GLOBAL TEMPLATES ================= */}
      {/* ================= GLOBAL TEMPLATES ================= */}
      <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className="h-4 w-4" />
          Global Grade Lock Templates
        </div>

        {templates.length > 0 ? (
          <div className="space-y-1">
            {templates.map((t) => (
              <div
                key={t.id}
                className="text-sm text-muted-foreground flex items-center gap-2"
              >
                <span className="font-medium text-foreground">{t.name}</span>
                {t.is_default && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    default
                  </span>
                )}
                {t.lock_deadline && (
                  <span>
                    — Deadline:{" "}
                    {format(new Date(t.lock_deadline), "MMM d, yyyy h:mm a")}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 ml-auto"
                  onClick={() => setEditTarget(t)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No templates configured yet.
          </div>
        )}
      </div>

      {/* ================= GLOBAL RULE ================= */}
      {activeTemplate?.lock_deadline && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Global Rule:</span>
          <span className="font-medium">
            {format(
              new Date(activeTemplate.lock_deadline),
              "MMM d, yyyy h:mm a",
            )}
          </span>
        </div>
      )}

      {/* ================= FILTERS ================= */}
      <GradeLockHierarchyFilter
        schoolYears={schoolYears ?? []}
        schoolYearsLoading={schoolYearsLoading}
        selectedSchoolYearId={selectedSchoolYearId ?? ""}
        selectedProgram={selectedProgram}
        selectedCourseStrand={selectedCourseStrand}
        selectedLevel={selectedLevel}
        filteredCount={filteredLocks.length}
        onSchoolYearSelect={handleSchoolYearSelect}
        onProgramChange={setSelectedProgram}
        onCourseStrandChange={(value) => {
          setSelectedCourseStrand(value);
          setSelectedLevel("");
        }}
        onLevelChange={setSelectedLevel}
        onReset={() => handleSchoolYearSelect(null)}
      />

      {/* ================= STATS ================= */}
      <GradeLockStats gradeLocks={filteredLocks} />

      {/* ================= TABLE ================= */}
      <DataTable
        columns={columns}
        data={filteredLocks}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No grade lock records exist. Try adjusting your filters."
      />

      {/* ================= APPLY CONFIRM MODAL ================= */}
      {applyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-background p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Apply Template
            </h2>

            <p className="text-sm text-muted-foreground">
              Applying to:{" "}
              <span className="font-medium text-foreground">
                {applyTarget.className}
              </span>
            </p>

            {/* Template selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Select Template</label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {selectedTemplate?.name ?? "Choose a template..."}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.is_default ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

              {/* Selected template details */}
              {selectedTemplate?.lock_deadline && (
                <p className="text-xs text-muted-foreground">
                  Deadline:{" "}
                  {format(
                    new Date(selectedTemplate.lock_deadline),
                    "MMM d, yyyy h:mm a",
                  )}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              This may override existing lock configuration.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApplyTarget(null)}>
                Cancel
              </Button>

              <Button
                disabled={isApplying || !selectedTemplateId}
                onClick={() => {
                  if (!applyTarget || !selectedTemplateId) return;
                  assignSetting(
                    {
                      classId: applyTarget.class_id,
                      settingId: selectedTemplateId,
                    },
                    { onSuccess: () => setApplyTarget(null) },
                  );
                }}
              >
                {isApplying ? "Applying..." : "Yes, Apply"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      <GradeLockSettingModal
        open={settingModalOpen || !!editTarget}
        onClose={() => {
          setSettingModalOpen(false);
          setEditTarget(null);
        }}
        existingSetting={
          editTarget ?? (settingModalOpen ? activeTemplate : null)
        }
      />

      <GradeLockOverrideDialog
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        gradeLock={overrideTarget}
      />
    </div>
  );
}
