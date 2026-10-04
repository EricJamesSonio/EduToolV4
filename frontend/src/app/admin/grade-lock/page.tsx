"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Settings } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
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
import { GradeLockUnlockRequestsPanel } from "@/components/admin/grade-lock/GradeLockUnlockRequestsPanel";
import { GradeLockApplyTemplateDialog } from "@/components/admin/grade-lock/GradeLockApplyTemplateDialog";
import { GradeLockApplyAllDialog } from "@/components/admin/grade-lock/GradeLockApplyAllDialog";
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
  const [applyAllOpen, setApplyAllOpen] = useState(false);

  const [actionTarget, setActionTarget] = useState<UnlockRequest | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode | null>(null);

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedCourseStrand, setSelectedCourseStrand] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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

  const resetHierarchyFilters = useCallback(() => {
    setSelectedProgram("");
    setSelectedCourseStrand("");
    setSelectedLevel("");
  }, []);

  const handleSchoolYearSelect = useCallback(
    (id: string | null) => {
      setSelectedSchoolYearId(id);
      resetHierarchyFilters();
    },
    [resetHierarchyFilters],
  );

  const handleProgramChange = useCallback((value: string) => {
    setSelectedProgram(value);
    // A new department invalidates its old course/strand and level.
    setSelectedCourseStrand("");
    setSelectedLevel("");
  }, []);

  const handleCourseStrandChange = useCallback((value: string) => {
    setSelectedCourseStrand(value);
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

  useEffect(() => {
    setPage(1);
  }, [selectedSchoolYearId, selectedProgram, selectedCourseStrand, selectedLevel]);

  const pagedLocks = useMemo(
    () => filteredLocks.slice((page - 1) * limit, page * limit),
    [filteredLocks, page, limit],
  );

  // Active school year's end date, else the latest end date (mirrors the backend).
  const deadlineFloor = useMemo(() => {
    const byEndDesc = [...(schoolYears ?? [])]
      .filter((sy) => sy.end_date)
      .sort(
        (a, b) =>
          new Date(b.end_date as string).getTime() -
          new Date(a.end_date as string).getTime(),
      );
    const active = byEndDesc.find((sy) => sy.status === "active");
    return (active ?? byEndDesc[0])?.end_date ?? null;
  }, [schoolYears]);

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
        <Button
          variant="outline"
          onClick={() => setApplyAllOpen(true)}
          disabled={filteredLocks.length === 0}
          className="gap-2"
        >
          <Layers className="h-4 w-4" />
          Apply to All
        </Button>
        <Button onClick={() => setSettingModalOpen(true)} className="gap-2">
          <Settings className="h-4 w-4" />
          Manage Templates
        </Button>
      </div>

      <GradeLockGlobalTemplates templates={templates} onEdit={setEditTarget} />

      <GradeLockHierarchyFilter
        selectedSchoolYearId={selectedSchoolYearId ?? ""}
        selectedProgram={selectedProgram}
        selectedCourseStrand={selectedCourseStrand}
        selectedLevel={selectedLevel}
        filteredCount={filteredLocks.length}
        onProgramChange={handleProgramChange}
        onCourseStrandChange={handleCourseStrandChange}
        onLevelChange={setSelectedLevel}
        onReset={resetHierarchyFilters}
      />

      <GradeLockStats gradeLocks={filteredLocks} />

      <GradeLockUnlockRequestsPanel
        requests={unlockRequests ?? []}
        onGrant={handleGrantRequest}
        onDeny={handleDenyRequest}
      />

      <DataTable
        columns={columns}
        data={pagedLocks}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No grade lock records exist. Try adjusting your filters."
      />

      <Pagination
        page={page}
        limit={limit}
        total={filteredLocks.length}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <GradeLockApplyTemplateDialog
        target={applyTarget}
        templates={templates}
        defaultTemplateId={activeTemplate?.id ?? templates[0]?.id ?? ""}
        onClose={() => setApplyTarget(null)}
      />

      <GradeLockApplyAllDialog
        open={applyAllOpen}
        onClose={() => setApplyAllOpen(false)}
        templates={templates}
        defaultTemplateId={activeTemplate?.id ?? templates[0]?.id ?? ""}
        classIds={filteredLocks.map((l) => l.class_id)}
        locks={filteredLocks}
      />

      <GradeLockSettingModal
        open={settingModalOpen || !!editTarget}
        onClose={() => {
          setSettingModalOpen(false);
          setEditTarget(null);
        }}
        existingSetting={editTarget ?? (settingModalOpen ? activeTemplate : null)}
        minDeadline={deadlineFloor}
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