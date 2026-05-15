// client/src/modules/admin/system/pages/SemesterTemplatePage.tsx

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/ConfirmationModal';
import {
  useAllSemesterTemplates,
  useSemesterTemplateAssignments,
  useDeleteSemesterTemplate,
} from '../hooks/useSemesterTemplates';
import { useSchoolYears } from '../../academic/hooks/useSchoolYears';
import { useProgramsBySchoolYear } from '../../academic/hooks/usePrograms';
import {
  SemesterTemplateFormModal,
  AssignTemplateModal,
} from '../components/semester-template';
import type { SchoolYearOption } from '../components/semester-template';
import TemplatesSection from '../components/semester-template/sections/TemplatesSection';
import AssignmentsSection from '../components/semester-template/sections/AssignmentsSection';
import type {
  SemesterTemplate,
  SemesterTemplateAssignment,
} from '../types/semester-template.types';
import type { Program } from '../../academic/types/program.types';

// ── Types ─────────────────────────────────────────────────────────────────────

type PageView = 'templates' | 'assignments';

interface SemesterTemplatePageProps {
  onBack: () => void;
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SemesterTemplatePage: React.FC<SemesterTemplatePageProps> = ({ onBack }) => {

  // ── View state ────────────────────────────────────────────────────────────
  const [view, setView]                           = useState<PageView>('templates');
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);

  // ── Modal state ───────────────────────────────────────────────────────────
  // undefined = closed, null = create mode, SemesterTemplate = edit mode
  const [formTemplate, setFormTemplate] = useState<SemesterTemplate | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<SemesterTemplate | null>(null);
  const [assignModal, setAssignModal] = useState<{
    program: Program;
    existingAssignment: SemesterTemplateAssignment | null;
  } | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: schoolYears = [],  isLoading: schoolYearsLoading  } = useSchoolYears();
  const { data: templates = [],    isLoading: templatesLoading     } = useAllSemesterTemplates();
  const { data: assignments = [],  isLoading: assignmentsLoading   } =
    useSemesterTemplateAssignments(selectedSchoolYearId ?? '');
  const { data: programs = [],     isLoading: programsLoading      } =
    useProgramsBySchoolYear(selectedSchoolYearId ?? '');

  const deleteMutation = useDeleteSemesterTemplate();

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedSchoolYear = useMemo((): SchoolYearOption | null => {
    if (!selectedSchoolYearId) return null;
    const sy = schoolYears.find((s) => s.id === selectedSchoolYearId);
    if (!sy) return null;
    return {
      id:         sy.id,
      name:       sy.name,
      start_date: sy.start_date ?? null,
      end_date:   sy.end_date   ?? null,
    };
  }, [schoolYears, selectedSchoolYearId]);

  const availableTemplatesForProgram = useMemo(() => {
    if (!assignModal) return [];
    return templates.filter((t) => t.program_type === assignModal.program.type);
  }, [assignModal, templates]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Template deleted.');
    } catch {
      // handled by apiClient interceptor
    } finally {
      setPendingDelete(null);
    }
  };

  const handleAssignFromCard = (_template: SemesterTemplate) => {
    setView('assignments');
  };

  const handleAssignProgram = (program: Program) => {
    const existingAssignment = assignments.find((a) => a.program_id === program.id) ?? null;
    setAssignModal({ program, existingAssignment });
  };

  const handleManageAssignment = (
    program: Program,
    assignment: SemesterTemplateAssignment,
  ) => {
    setAssignModal({ program, existingAssignment: assignment });
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

      {/* ── View toggle + actions bar ── */}
      <div className="card grading-scale-filters">
        <div className="filter-row">
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

      {/* ── Tab content ── */}
      {view === 'templates' && (
        <TemplatesSection
          templates={templates}
          isLoading={templatesLoading}
          onEdit={(tmpl) => setFormTemplate(tmpl)}
          onDelete={(tmpl) => setPendingDelete(tmpl)}
          onAssign={handleAssignFromCard}
          onCreateFirst={() => setFormTemplate(null)}
        />
      )}

      {view === 'assignments' && (
        <AssignmentsSection
          schoolYears={schoolYears}
          schoolYearsLoading={schoolYearsLoading}
          selectedSchoolYearId={selectedSchoolYearId}
          onSelectSchoolYear={setSelectedSchoolYearId}
          programs={programs}
          assignments={assignments}
          assignmentsLoading={assignmentsLoading}
          programsLoading={programsLoading}
          onAssign={handleAssignProgram}
          onManage={handleManageAssignment}
        />
      )}

      {/* ── Create / Edit template modal ── */}
      {formTemplate !== undefined && (
        <SemesterTemplateFormModal
          template={formTemplate}
          onClose={() => setFormTemplate(undefined)}
        />
      )}

      {/* ── Assign / Manage modal ── */}
      {assignModal && selectedSchoolYear && (
        <AssignTemplateModal
          program={assignModal.program}
          availableTemplates={availableTemplatesForProgram}
          existingAssignment={assignModal.existingAssignment}
          schoolYear={selectedSchoolYear}
          onClose={() => setAssignModal(null)}
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