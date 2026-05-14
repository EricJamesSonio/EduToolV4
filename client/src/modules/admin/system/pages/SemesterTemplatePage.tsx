// client/src/modules/admin/system/pages/SemesterTemplatePage.tsx

import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ConfirmationModal';
import SchoolYearSelector from '@/components/shared/SchoolYearSelector';
import {
  useAllSemesterTemplates,
  useSemesterTemplateAssignments,
  useDeleteSemesterTemplate,
} from '../hooks/useSemesterTemplates';
import { useSchoolYears } from '../../academic/hooks/useSchoolYears';
import { useProgramsBySchoolYear } from '../../academic/hooks/usePrograms';
import {
  SemesterTemplateCard,
  AssignmentCard,
  SemesterTemplateFormModal,
  AssignTemplateModal,
} from '../components/semester-template';
import type {
  SemesterTemplate,
  SemesterTemplateAssignment,
} from '../types/semester-template.types';

// ── Types ─────────────────────────────────────────────────────────────────────

type PageView = 'templates' | 'assignments';

interface SemesterTemplatePageProps {
  onBack: () => void;
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SemesterTemplatePage: React.FC<SemesterTemplatePageProps> = ({ onBack }) => {
  // ── School year (only used for assignments tab) ────────────────────────────
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [view, setView] = useState<PageView>('templates');

  // ── Template form modal ───────────────────────────────────────────────────
  // undefined = closed, null = create, SemesterTemplate = edit
  const [formTemplate, setFormTemplate] = useState<SemesterTemplate | null | undefined>(
    undefined,
  );

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState<SemesterTemplate | null>(null);

  // ── Assign modal ──────────────────────────────────────────────────────────
  // Opened from template card "Assign to Program"
  const [assignTarget, setAssignTarget] = useState<{
    template: SemesterTemplate;
    programId: string | null;
    programName: string | null;
    existingAssignment: SemesterTemplateAssignment | null;
  } | null>(null);

  // Opened from assignment card "Manage"
  const [manageTarget, setManageTarget] =
    useState<SemesterTemplateAssignment | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: schoolYears = [], isLoading: schoolYearsLoading } = useSchoolYears();

  // Templates: global (org-wide), no school year filter
  const { data: templates = [], isLoading: templatesLoading } =
    useAllSemesterTemplates();

  // Assignments: scoped to selected school year
  const { data: assignments = [], isLoading: assignmentsLoading } =
    useSemesterTemplateAssignments(selectedSchoolYearId ?? '');

  // Programs: needed by assign modal — load for selected school year
  const { data: programs = [], isLoading: programsLoading } =
    useProgramsBySchoolYear(selectedSchoolYearId ?? '');

  const deleteMutation = useDeleteSemesterTemplate();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Template deleted.');
    } catch {
      // handled by apiClient
    } finally {
      setPendingDelete(null);
    }
  };

  const handleAssignFromCard = (template: SemesterTemplate) => {
    // No program pre-selected — modal will have full school year + program pickers
    const existingAssignment = selectedSchoolYearId
      ? (assignments.find((a) => a.template_id === template.id) ?? null)
      : null;

    setAssignTarget({
      template,
      programId: null,
      programName: null,
      existingAssignment,
    });
  };

  const handleManageAssignment = (assignment: SemesterTemplateAssignment) => {
    const tmpl =
      templates.find((t) => t.id === assignment.template_id) ??
      assignment.template;

    setAssignTarget({
      template: tmpl,
      programId: assignment.program_id,
      programName: assignment.program.name,
      existingAssignment: assignment,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="system-detail-page">
      {/* ── Header ── */}
      <div className="view-container">
        <div className="view-header">
          <button type="button" onClick={onBack} className="back-button">
            Back to System
          </button>
          <div className="header-title">
            <h2 className="dashboard-section-title">Semester Templates</h2>
            <p className="dashboard-section-subtitle">
              Define reusable semester &amp; term structures, then assign them to programs per school year.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters + view toggle ── */}
      <div className="card grading-scale-filters">
        <div className="filter-row">
          {/* School year selector — only relevant for Assignments tab */}
          {view === 'assignments' && (
            <div className="form-group filter-group">
              <label className="form-label">School Year</label>
              <SchoolYearSelector
                schoolYears={schoolYears}
                isLoading={schoolYearsLoading}
                selectedId={selectedSchoolYearId}
                onSelect={setSelectedSchoolYearId}
              />
            </div>
          )}

          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn${view === 'templates' ? ' active' : ''}`}
              onClick={() => setView('templates')}
            >
              Templates
              {templates.length > 0 && (
                <span className="view-toggle-badge">{templates.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`view-toggle-btn${view === 'assignments' ? ' active' : ''}`}
              onClick={() => setView('assignments')}
            >
              Assignments
              {assignments.length > 0 && (
                <span className="view-toggle-badge">{assignments.length}</span>
              )}
            </button>
          </div>

          {view === 'templates' && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setFormTemplate(null)}
            >
              + New Template
            </button>
          )}
        </div>
      </div>

      {/* ── Templates grid (global — no school year needed) ── */}
      {view === 'templates' && (
        <div className="grading-scales-grid">
          {templatesLoading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <span className="loading-text">Loading templates…</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <p>No semester templates yet.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setFormTemplate(null)}
              >
                Create First Template
              </button>
            </div>
          ) : (
            templates.map((t) => {
              const assignment = assignments.find((a) => a.template_id === t.id);
              return (
                <SemesterTemplateCard
                  key={t.id}
                  template={t}
                  assignment={assignment}
                  onEdit={(tmpl) => setFormTemplate(tmpl)}
                  onDelete={(tmpl) => setPendingDelete(tmpl)}
                  onAssign={handleAssignFromCard}
                />
              );
            })
          )}
        </div>
      )}

      {/* ── Assignments grid (scoped to school year) ── */}
      {view === 'assignments' && (
        <div className="grading-scales-grid">
          {!selectedSchoolYearId ? (
            <div className="empty-state">
              <p>Select a school year above to view assignments.</p>
            </div>
          ) : assignmentsLoading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <span className="loading-text">Loading assignments…</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <p>No template assignments yet for this school year.</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setView('templates')}
              >
                Go to Templates
              </button>
            </div>
          ) : (
            assignments.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                onManage={handleManageAssignment}
              />
            ))
          )}
        </div>
      )}

      {/* ── Create / Edit template modal ── */}
      {formTemplate !== undefined && (
        <SemesterTemplateFormModal
          template={formTemplate}
          onClose={() => setFormTemplate(undefined)}
        />
      )}

      {/* ── Assign / Manage modal ── */}
      {assignTarget && (
        <AssignTemplateModal
          template={assignTarget.template}
          allTemplates={templates}
          existingAssignment={assignTarget.existingAssignment}
          programId={assignTarget.programId}
          programName={assignTarget.programName}
          schoolYears={schoolYears}
          selectedSchoolYearId={selectedSchoolYearId}
          programs={programs}
          programsLoading={programsLoading}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {/* ── Delete confirm ── */}
      <ConfirmationModal
        isOpen={!!pendingDelete}
        title="Delete Semester Template"
        message={`Are you sure you want to delete "${pendingDelete?.name}"? This cannot be undone and will remove all associated assignments.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default SemesterTemplatePage;