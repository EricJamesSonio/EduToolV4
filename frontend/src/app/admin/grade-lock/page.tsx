// ===== File: frontend\src\app\admin\grade-lock\page.tsx =====
"use client";

import { useCallback, useMemo, useState } from "react";
import { Settings } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";

import { GradeLockHierarchyFilter } from "@/components/admin/grade-lock/GradeLockHierarchyFilter";
import { GradeLockSettingModal } from "@/components/admin/grade-lock/GradeLockSettingModal";
import { GradeLockOverrideDialog } from "@/components/admin/grade-lock/GradeLockOverrideDialog";
import { GradeLockStats } from "@/components/admin/grade-lock/GradeLockStats";
import { GradeLockGlobalTemplates } from "@/components/admin/grade-lock/GradeLockGlobalTemplates";
import { GradeLockGlobalRuleBanner } from "@/components/admin/grade-lock/GradeLockGlobalRuleBanner";
import { GradeLockUnlockRequestsPanel } from "@/components/admin/grade-lock/GradeLockUnlockRequestsPanel";
import { GradeLockApplyTemplateDialog } from "@/components/admin/grade-lock/GradeLockApplyTemplateDialog";
import { GradeLockUnlockActionDialog } from "@/components/admin/grade-lock/GradeLockUnlockActionDialog";

import { useGradeLockColumns } from "@/hooks/admin/useGradeLockColumns";
import {
  useGradeLocks,
  useGradeLockSettings,
  useUnlockRequests,
} from "@/hooks/admin/useGradeLocks";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";

import type { GradeLock, GradeLockSetting, UnlockRequest } from "@/types/admin/grade-lock.types";

type ActionMode = "grant" | "deny";

export default function GradeLockPage(): React.ReactElement {
  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GradeLockSetting | null>(null);

  const [overrideTarget, setOverrideTarget] = useState<GradeLock | null>(null);
  const [applyTarget, setApplyTarget] = useState<GradeLock | null>(null);

  const [actionTarget, setActionTarget] = useState<UnlockRequest | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode | null>(null);

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedCourseStrand, setSelectedCourseStrand] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const { data: schoolYears, isLoading: schoolYearsLoading } = useSchoolYears();
  const { data: gradeLocks, isLoading } = useGradeLocks(selectedSchoolYearId ?? undefined);
  const { data: settings } = useGradeLockSettings();
  const { data: unlockRequests } = useUnlockRequests();

  const locks = useMemo(() => (Array.isArray(gradeLocks) ? gradeLocks : []), [gradeLocks]);
  const templates = useMemo(() => (Array.isArray(settings) ? settings : []), [settings]);

  const settingMap = useMemo(() => {
    if (!settings) return new Map<string, string>();
    return new Map(settings.map((s) => [s.id, s.name]));
  }, [settings]);

  const activeTemplate = useMemo(
    () => templates.find((t) => t.is_default) ?? templates[0] ?? null,
    [templates],
  );

  const handleSchoolYearSelect = useCallback((id: string | null) => {
    setSelectedSchoolYearId(id);
    setSelectedProgram("");
    setSelectedCourseStrand("");
    setSelectedLevel("");
  }, []);

  const handleApplyTemplate = useCallback((lock: GradeLock) => {
    setApplyTarget(lock);
  }, []);

  const handleOverride = useCallback((lock: GradeLock) => {
    setOverrideTarget(lock);
  }, []);

  const handleGrantRequest = useCallback((req: UnlockRequest) => {
    setActionTarget(req);
    setActionMode("grant");
  }, []);

  const handleDenyRequest = useCallback((req: UnlockRequest) => {
    setActionTarget(req);
    setActionMode("deny");
  }, []);

  const columns = useGradeLockColumns(handleOverride, handleApplyTemplate, settingMap);

  const filteredLocks = useMemo(() => {
    let result = locks;

    if (selectedSchoolYearId) {
      result = result.filter((lock) => lock.class?.school_year_id === selectedSchoolYearId);
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
      result = result.filter((lock) => lock.class?.subject?.level_id === selectedLevel);
    }

    return result;
  }, [locks, selectedSchoolYearId, selectedProgram, selectedCourseStrand, selectedLevel]);

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title="Grade Lock System"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_grade_lock" />
            <SchoolYearSelector
              schoolYears={schoolYears ?? []}
              isLoading={schoolYearsLoading}
              selectedId={selectedSchoolYearId}
              onSelect={handleSchoolYearSelect}
            />
          </div>
        }
      />

      <div className="flex items-center justify-end gap-2">
        <Button onClick={() => setSettingModalOpen(true)} className="gap-2">
          <Settings className="h-4 w-4" />
          Manage Templates
        </Button>
      </div>

      <GradeLockGlobalTemplates templates={templates} onEdit={setEditTarget} />
      <GradeLockGlobalRuleBanner deadline={activeTemplate?.lock_deadline} />

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

      <GradeLockStats gradeLocks={filteredLocks} />

      <GradeLockUnlockRequestsPanel
        requests={unlockRequests ?? []}
        onGrant={handleGrantRequest}
        onDeny={handleDenyRequest}
      />

      <DataTable
        columns={columns}
        data={filteredLocks}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No grade lock records exist. Try adjusting your filters."
      />

      <GradeLockApplyTemplateDialog
        target={applyTarget}
        templates={templates}
        defaultTemplateId={activeTemplate?.id ?? templates[0]?.id ?? ""}
        onClose={() => setApplyTarget(null)}
      />

      <GradeLockSettingModal
        open={settingModalOpen || !!editTarget}
        onClose={() => {
          setSettingModalOpen(false);
          setEditTarget(null);
        }}
        existingSetting={editTarget ?? (settingModalOpen ? activeTemplate : null)}
      />

      <GradeLockOverrideDialog
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        gradeLock={overrideTarget}
      />

      <GradeLockUnlockActionDialog
        target={actionTarget}
        mode={actionMode}
        onClose={() => {
          setActionTarget(null);
          setActionMode(null);
        }}
      />
    </div>
  );
}