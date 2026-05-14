// client/src/modules/admin/system/pages/SemesterTemplatePage.tsx

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useSemesterTemplatesBySchoolYear,
  useSemesterTemplateAssignments,
  useCreateSemesterTemplate,
  useUpdateSemesterTemplate,
  useDeleteSemesterTemplate,
  useAssignSemesterTemplate,
  useRemoveSemesterTemplateAssignment,
  useSaveTermDates,
} from '../hooks/useSemesterTemplates';
import { useSchoolYears } from '../../academic/hooks/useSchoolYears';
import { useProgramsBySchoolYear } from '../../academic/hooks/usePrograms';
import SchoolYearSelector from '@/components/shared/SchoolYearSelector';
import type {
  SemesterTemplate,
  SemesterTemplateAssignment,
  SemesterTemplateItem,
  SemesterTemplateTerm,
  CreateSemesterTemplateDto,
  UpdateSemesterTemplateDto,
  ProgramType,
  TermDateMap,
} from '../types/semester-template.types';
import { PROGRAM_TYPE_LABELS } from '../types/semester-template.types';

// ── Constants ────────────────────────────────────────────────────────────────

const PROGRAM_TYPES: ProgramType[] = [
  'daycare',
  'kinder',
  'elementary',
  'jhs',
  'shs',
  'college',
  'custom',
];

const EMPTY_TERM = { name: '', orderIndex: 1 };
const EMPTY_SEMESTER = { name: '', orderIndex: 1, terms: [{ ...EMPTY_TERM }] };

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildTermDateMap(
  assignment: SemesterTemplateAssignment,
): TermDateMap {
  const map: TermDateMap = {};
  for (const td of assignment.termDates) {
    map[td.term_id] = {
      startDate: td.start_date.slice(0, 10),
      endDate: td.end_date.slice(0, 10),
    };
  }
  return map;
}

// ── TermDateRow ──────────────────────────────────────────────────────────────

interface TermDateRowProps {
  term: SemesterTemplateTerm;
  semesterName: string;
  value: { startDate: string; endDate: string };
  onChange: (termId: string, field: 'startDate' | 'endDate', val: string) => void;
  disabled?: boolean;
}

const TermDateRow: React.FC<TermDateRowProps> = ({
  term,
  semesterName,
  value,
  onChange,
  disabled,
}) => (
  <div className="term-date-row">
    <div className="term-date-label">
      <span className="term-date-semester">{semesterName}</span>
      <span className="term-date-name">{term.name}</span>
    </div>
    <input
      type="date"
      className="form-input term-date-input"
      value={value.startDate}
      onChange={(e) => onChange(term.id, 'startDate', e.target.value)}
      disabled={disabled}
    />
    <span className="range-dash">–</span>
    <input
      type="date"
      className="form-input term-date-input"
      value={value.endDate}
      onChange={(e) => onChange(term.id, 'endDate', e.target.value)}
      disabled={disabled}
    />
  </div>
);

// ── AssignTemplateModal ───────────────────────────────────────────────────────

interface AssignTemplateModalProps {
  schoolYearId: string;
  templates: SemesterTemplate[];
  existingAssignment?: SemesterTemplateAssignment | null;
  programId: string;
  programName: string;
  onClose: () => void;
}

const AssignTemplateModal: React.FC<AssignTemplateModalProps> = ({
  schoolYearId,
  templates,
  existingAssignment,
  programId,
  programName,
  onClose,
}) => {
  const assignMutation = useAssignSemesterTemplate();
  const saveTermDatesMutation = useSaveTermDates();
  const removeMutation = useRemoveSemesterTemplateAssignment();

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    existingAssignment?.template_id ?? '',
  );
  const [termDateMap, setTermDateMap] = useState<TermDateMap>(
    existingAssignment ? buildTermDateMap(existingAssignment) : {},
  );

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const isSaving = assignMutation.isPending || saveTermDatesMutation.isPending;

  const allTerms = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.semesters.flatMap((sem) =>
      sem.terms.map((t) => ({ term: t, semesterName: sem.name })),
    );
  }, [selectedTemplate]);

  const handleTermDateChange = (
    termId: string,
    field: 'startDate' | 'endDate',
    val: string,
  ) => {
    setTermDateMap((prev) => ({
      ...prev,
      [termId]: { ...prev[termId], startDate: prev[termId]?.startDate ?? '', endDate: prev[termId]?.endDate ?? '', [field]: val },
    }));
  };

  const handleSave = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template.');
      return;
    }

    try {
      // 1. Assign the template to the program
      await assignMutation.mutateAsync({
        programId,
        templateId: selectedTemplateId,
      });

      // 2. Save term dates if any have been filled
      const termDates = Object.entries(termDateMap)
        .filter(([, v]) => v.startDate && v.endDate)
        .map(([termId, v]) => ({
          termId,
          startDate: v.startDate,
          endDate: v.endDate,
        }));

      if (termDates.length > 0) {
        await saveTermDatesMutation.mutateAsync({ programId, data: { termDates } });
      }

      toast.success('Template assigned successfully.');
      onClose();
    } catch {
      // handled by apiClient interceptor
    }
  };

  const handleRemove = async () => {
    try {
      await removeMutation.mutateAsync(programId);
      toast.success('Assignment removed.');
      onClose();
    } catch {
      // handled by apiClient interceptor
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            Assign Semester Template — <span className="modal-subtitle">{programName}</span>
          </h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Template selector */}
          <div className="form-group">
            <label className="form-label">Semester Template</label>
            <div className="program-select-wrapper">
              <select
                className="program-select"
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  setTermDateMap({});
                }}
                disabled={isSaving}
              >
                <option value="">Select a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {PROGRAM_TYPE_LABELS[t.program_type]}
                  </option>
                ))}
              </select>
              <div className="program-select__chevron" aria-hidden="true">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Template structure preview */}
          {selectedTemplate && (
            <div className="form-group">
              <label className="form-label">Template Structure</label>
              <div className="template-structure-preview">
                {selectedTemplate.semesters.map((sem) => (
                  <div key={sem.id} className="template-sem-preview">
                    <span className="template-sem-name">{sem.name}</span>
                    <div className="template-term-chips">
                      {sem.terms.map((t) => (
                        <span key={t.id} className="template-term-chip">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Term dates — inline after assigning */}
          {allTerms.length > 0 && (
            <div className="form-group">
              <label className="form-label">Term Dates</label>
              <div className="term-dates-header-row">
                <span />
                <span className="term-dates-col-label">Start Date</span>
                <span />
                <span className="term-dates-col-label">End Date</span>
              </div>
              <div className="term-dates-list">
                {allTerms.map(({ term, semesterName }) => (
                  <TermDateRow
                    key={term.id}
                    term={term}
                    semesterName={semesterName}
                    value={
                      termDateMap[term.id] ?? { startDate: '', endDate: '' }
                    }
                    onChange={handleTermDateChange}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {existingAssignment && (
            <button
              type="button"
              className="btn-danger"
              onClick={handleRemove}
              disabled={isSaving || removeMutation.isPending}
            >
              {removeMutation.isPending ? 'Removing…' : 'Remove Assignment'}
            </button>
          )}
          <div className="modal-footer-right">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── SemesterTemplateFormModal ─────────────────────────────────────────────────

interface SemesterTemplateFormModalProps {
  template?: SemesterTemplate | null;
  onClose: () => void;
}

const SemesterTemplateFormModal: React.FC<SemesterTemplateFormModalProps> = ({
  template,
  onClose,
}) => {
  const isEdit = !!template;
  const createMutation = useCreateSemesterTemplate();
  const updateMutation = useUpdateSemesterTemplate();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState(template?.name ?? '');
  const [programType, setProgramType] = useState<ProgramType>(
    template?.program_type ?? 'college',
  );
  const [semesters, setSemesters] = useState<CreateSemesterTemplateDto['semesters']>(
    template
      ? template.semesters.map((sem) => ({
          name: sem.name,
          orderIndex: sem.order_index,
          terms: sem.terms.map((t) => ({
            name: t.name,
            orderIndex: t.order_index,
          })),
        }))
      : [{ ...EMPTY_SEMESTER, terms: [{ ...EMPTY_TERM }] }],
  );

  const addSemester = () =>
    setSemesters((prev) => [
      ...prev,
      { name: '', orderIndex: prev.length + 1, terms: [{ ...EMPTY_TERM }] },
    ]);

  const removeSemester = (si: number) =>
    setSemesters((prev) => prev.filter((_, i) => i !== si));

  const updateSemesterField = (
    si: number,
    field: 'name' | 'orderIndex',
    val: string | number,
  ) =>
    setSemesters((prev) =>
      prev.map((sem, i) => (i === si ? { ...sem, [field]: val } : sem)),
    );

  const addTerm = (si: number) =>
    setSemesters((prev) =>
      prev.map((sem, i) =>
        i === si
          ? {
              ...sem,
              terms: [
                ...sem.terms,
                { name: '', orderIndex: sem.terms.length + 1 },
              ],
            }
          : sem,
      ),
    );

  const removeTerm = (si: number, ti: number) =>
    setSemesters((prev) =>
      prev.map((sem, i) =>
        i === si
          ? { ...sem, terms: sem.terms.filter((_, j) => j !== ti) }
          : sem,
      ),
    );

  const updateTermField = (
    si: number,
    ti: number,
    field: 'name' | 'orderIndex',
    val: string | number,
  ) =>
    setSemesters((prev) =>
      prev.map((sem, i) =>
        i === si
          ? {
              ...sem,
              terms: sem.terms.map((t, j) =>
                j === ti ? { ...t, [field]: val } : t,
              ),
            }
          : sem,
      ),
    );

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Template name is required.'); return; }
    if (semesters.length === 0) { toast.error('Add at least one semester.'); return; }
    for (const sem of semesters) {
      if (!sem.name.trim()) { toast.error('All semesters must have a name.'); return; }
      if (sem.terms.length === 0) { toast.error(`Semester "${sem.name}" needs at least one term.`); return; }
      for (const t of sem.terms) {
        if (!t.name.trim()) { toast.error('All terms must have a name.'); return; }
      }
    }

    try {
      if (isEdit && template) {
        const dto: UpdateSemesterTemplateDto = { name: name.trim(), semesters };
        await updateMutation.mutateAsync({ id: template.id, data: dto });
        toast.success('Template updated.');
      } else {
        const dto: CreateSemesterTemplateDto = {
          name: name.trim(),
          programType,
          semesters,
        };
        await createMutation.mutateAsync(dto);
        toast.success('Template created.');
      }
      onClose();
    } catch {
      // handled by apiClient interceptor
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit ? 'Edit Semester Template' : 'New Semester Template'}
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Template Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. College Standard (2 Sem)"
              maxLength={100}
              disabled={isSaving}
            />
          </div>

          {/* Program type — only on create */}
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Program Type</label>
              <div className="program-select-wrapper">
                <select
                  className="program-select"
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value as ProgramType)}
                  disabled={isSaving}
                >
                  {PROGRAM_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {PROGRAM_TYPE_LABELS[pt]}
                    </option>
                  ))}
                </select>
                <div className="program-select__chevron" aria-hidden="true">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Semesters */}
          <div className="form-group">
            <div className="ranges-header">
              <label className="form-label">Semesters &amp; Terms</label>
              <button
                type="button"
                className="add-range-btn"
                onClick={addSemester}
                disabled={isSaving}
              >
                + Add Semester
              </button>
            </div>

            <div className="semester-items-list">
              {semesters.map((sem, si) => (
                <div key={si} className="semester-item-block">
                  <div className="semester-item-header">
                    <input
                      type="text"
                      className="form-input semester-name-input"
                      value={sem.name}
                      onChange={(e) => updateSemesterField(si, 'name', e.target.value)}
                      placeholder={`Semester ${si + 1} name`}
                      maxLength={100}
                      disabled={isSaving}
                    />
                    <input
                      type="number"
                      className="form-input order-input"
                      value={sem.orderIndex}
                      min={1}
                      onChange={(e) =>
                        updateSemesterField(si, 'orderIndex', Number(e.target.value))
                      }
                      title="Order"
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      className="remove-range-btn"
                      onClick={() => removeSemester(si)}
                      disabled={isSaving || semesters.length === 1}
                      aria-label="Remove semester"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Terms */}
                  <div className="term-items-list">
                    {sem.terms.map((term, ti) => (
                      <div key={ti} className="term-item-row">
                        <span className="term-item-bullet">·</span>
                        <input
                          type="text"
                          className="form-input term-name-input"
                          value={term.name}
                          onChange={(e) =>
                            updateTermField(si, ti, 'name', e.target.value)
                          }
                          placeholder={`Term ${ti + 1} name`}
                          maxLength={100}
                          disabled={isSaving}
                        />
                        <input
                          type="number"
                          className="form-input order-input"
                          value={term.orderIndex}
                          min={1}
                          onChange={(e) =>
                            updateTermField(si, ti, 'orderIndex', Number(e.target.value))
                          }
                          title="Order"
                          disabled={isSaving}
                        />
                        <button
                          type="button"
                          className="remove-range-btn"
                          onClick={() => removeTerm(si, ti)}
                          disabled={isSaving || sem.terms.length === 1}
                          aria-label="Remove term"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-term-btn"
                      onClick={() => addTerm(si)}
                      disabled={isSaving}
                    >
                      + Add Term
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SemesterTemplateCard ──────────────────────────────────────────────────────

interface SemesterTemplateCardProps {
  template: SemesterTemplate;
  assignment?: SemesterTemplateAssignment;
  onEdit: (t: SemesterTemplate) => void;
  onDelete: (t: SemesterTemplate) => void;
  onAssign: (t: SemesterTemplate) => void;
}

const SemesterTemplateCard: React.FC<SemesterTemplateCardProps> = ({
  template,
  assignment,
  onEdit,
  onDelete,
  onAssign,
}) => {
  const totalTerms = template.semesters.reduce(
    (acc, sem) => acc + sem.terms.length,
    0,
  );
  const hasTermDates = assignment && assignment.termDates.length > 0;

  return (
    <div className="grading-scale-card card">
      <div className="scale-card-header">
        <div>
          <h4 className="scale-name">{template.name}</h4>
          <span className="scale-range-count">
            {PROGRAM_TYPE_LABELS[template.program_type]}
          </span>
        </div>
        <div className="scale-card-actions action-buttons action-buttons-sm">
          <button
            type="button"
            className="action-button action-button-edit"
            onClick={() => onEdit(template)}
          >
            Edit
          </button>
          <button
            type="button"
            className="action-button action-button-delete"
            onClick={() => onDelete(template)}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Semester + term structure */}
      <div className="ranges-preview">
        {template.semesters.map((sem) => (
          <div key={sem.id} className="sem-preview-row">
            <span className="sem-preview-name">{sem.name}</span>
            <div className="template-term-chips">
              {sem.terms.map((t) => (
                <span key={t.id} className="template-term-chip">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="scale-card-footer">
        <span className="scale-stat passing">
          {template.semesters.length} semester{template.semesters.length !== 1 ? 's' : ''}
        </span>
        <span className="scale-stat">
          {totalTerms} term{totalTerms !== 1 ? 's' : ''}
        </span>
        {hasTermDates && (
          <span className="scale-stat passing">✓ Dates set</span>
        )}
        <button
          type="button"
          className="assign-template-btn"
          onClick={() => onAssign(template)}
        >
          {assignment ? 'Manage Assignment' : 'Assign to Program'}
        </button>
      </div>
    </div>
  );
};

// ── AssignmentCard ────────────────────────────────────────────────────────────

interface AssignmentCardProps {
  assignment: SemesterTemplateAssignment;
  templates: SemesterTemplate[];
  onManage: (assignment: SemesterTemplateAssignment) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  templates,
  onManage,
}) => {
  const totalTerms = assignment.template.semesters.reduce(
    (acc, s) => acc + s.terms.length,
    0,
  );
  const datesSet = assignment.termDates.length;

  return (
    <div className="grading-scale-card card">
      <div className="scale-card-header">
        <div>
          <h4 className="scale-name">{assignment.program.name}</h4>
          <span className="scale-range-count">
            {PROGRAM_TYPE_LABELS[assignment.program.type]}
          </span>
        </div>
        <button
          type="button"
          className="action-button action-button-edit"
          onClick={() => onManage(assignment)}
        >
          Manage
        </button>
      </div>

      <div className="ranges-preview">
        <div className="sem-preview-row">
          <span className="sem-preview-name">Template:</span>
          <span className="template-term-chip">{assignment.template.name}</span>
        </div>
        {assignment.template.semesters.map((sem) => (
          <div key={sem.id} className="sem-preview-row">
            <span className="sem-preview-name">{sem.name}</span>
            <div className="template-term-chips">
              {sem.terms.map((t) => {
                const td = assignment.termDates.find((d) => d.term_id === t.id);
                return (
                  <span
                    key={t.id}
                    className={`template-term-chip ${td ? 'chip-dated' : ''}`}
                    title={
                      td
                        ? `${td.start_date.slice(0, 10)} → ${td.end_date.slice(0, 10)}`
                        : 'No dates set'
                    }
                  >
                    {t.name}
                    {td ? ' ✓' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="scale-card-footer">
        <span className="scale-stat passing">
          {datesSet}/{totalTerms} dates set
        </span>
        {datesSet === totalTerms && totalTerms > 0 && (
          <span className="locked-badge">✓ Complete</span>
        )}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

type PageView = 'templates' | 'assignments';

interface SemesterTemplatePageProps {
  onBack: () => void;
}

const SemesterTemplatePage: React.FC<SemesterTemplatePageProps> = ({ onBack }) => {
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [view, setView] = useState<PageView>('templates');

  // Template modals
  const [modalTemplate, setModalTemplate] = useState<SemesterTemplate | null | undefined>(
    undefined,
  );
  const [pendingDelete, setPendingDelete] = useState<SemesterTemplate | null>(null);

  // Assignment modal state
  const [assignModal, setAssignModal] = useState<{
    template: SemesterTemplate;
    programId: string;
    programName: string;
    existingAssignment: SemesterTemplateAssignment | null;
  } | null>(null);

  // Assignment modal opened from the Assignments view
  const [manageModal, setManageModal] = useState<SemesterTemplateAssignment | null>(null);

  const { data: schoolYears = [], isLoading: schoolYearsLoading } = useSchoolYears();
  const { data: templates = [], isLoading: templatesLoading } =
    useSemesterTemplatesBySchoolYear(selectedSchoolYearId ?? '');
  const { data: assignments = [], isLoading: assignmentsLoading } =
    useSemesterTemplateAssignments(selectedSchoolYearId ?? '');
  const { data: programs = [], isLoading: programsLoading } =
    useProgramsBySchoolYear(selectedSchoolYearId ?? '');

  const deleteMutation = useDeleteSemesterTemplate();

  const handleSchoolYearSelect = (id: string) => {
    setSelectedSchoolYearId(id);
  };

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

  // When clicking "Assign to Program" from a template card, pick which program
  const [pickProgramFor, setPickProgramFor] = useState<SemesterTemplate | null>(null);
  const [pickedProgramId, setPickedProgramId] = useState('');

  const handleOpenAssign = (template: SemesterTemplate) => {
    setPickProgramFor(template);
    setPickedProgramId('');
  };

  const handleConfirmProgramPick = () => {
    if (!pickProgramFor || !pickedProgramId) return;
    const program = programs.find((p) => p.id === pickedProgramId);
    if (!program) return;
    const existingAssignment =
      assignments.find((a) => a.program_id === pickedProgramId) ?? null;
    setAssignModal({
      template: pickProgramFor,
      programId: pickedProgramId,
      programName: program.name,
      existingAssignment,
    });
    setPickProgramFor(null);
    setPickedProgramId('');
  };

  const handleManageAssignment = (assignment: SemesterTemplateAssignment) => {
    setManageModal(assignment);
  };

  const isLoading =
    view === 'templates' ? templatesLoading : assignmentsLoading;

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
              Define reusable semester &amp; term structures, then assign them to programs.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters + view toggle ── */}
      <div className="card grading-scale-filters">
        <div className="filter-row">
          <div className="form-group filter-group">
            <label className="form-label">School Year</label>
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={schoolYearsLoading}
              selectedId={selectedSchoolYearId}
              onSelect={handleSchoolYearSelect}
            />
          </div>

          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn${view === 'templates' ? ' active' : ''}`}
              onClick={() => setView('templates')}
            >
              Templates
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
              onClick={() => setModalTemplate(null)}
            >
              + New Template
            </button>
          )}
        </div>
      </div>

      {/* ── Templates grid ── */}
      {view === 'templates' && (
        <div className="grading-scales-grid">
          {!selectedSchoolYearId ? (
            <div className="empty-state">
              <p>Select a school year above to view semester templates.</p>
            </div>
          ) : isLoading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <span className="loading-text">Loading templates…</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <p>No semester templates found for this school year.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setModalTemplate(null)}
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
                  onEdit={(tmpl) => setModalTemplate(tmpl)}
                  onDelete={(tmpl) => setPendingDelete(tmpl)}
                  onAssign={handleOpenAssign}
                />
              );
            })
          )}
        </div>
      )}

      {/* ── Assignments grid ── */}
      {view === 'assignments' && (
        <div className="grading-scales-grid">
          {!selectedSchoolYearId ? (
            <div className="empty-state">
              <p>Select a school year above to view assignments.</p>
            </div>
          ) : isLoading ? (
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
                templates={templates}
                onManage={handleManageAssignment}
              />
            ))
          )}
        </div>
      )}

      {/* ── Program picker modal (before AssignTemplateModal) ── */}
      {pickProgramFor && (
        <div className="modal-overlay" onClick={() => setPickProgramFor(null)}>
          <div
            className="modal-panel modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                Assign "{pickProgramFor.name}" to Program
              </h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPickProgramFor(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Program</label>
                {programsLoading ? (
                  <div className="program-select__skeleton" />
                ) : (
                  <div className="program-select-wrapper">
                    <select
                      className="program-select"
                      value={pickedProgramId}
                      onChange={(e) => setPickedProgramId(e.target.value)}
                    >
                      <option value="">
                        {programs.length === 0
                          ? 'No programs in this school year'
                          : 'Select program…'}
                      </option>
                      {programs
                        .filter((p) => p.type === pickProgramFor.program_type)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    <div className="program-select__chevron" aria-hidden="true">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
                {programs.filter((p) => p.type === pickProgramFor.program_type)
                  .length === 0 &&
                  !programsLoading && (
                    <p className="empty-ranges-hint">
                      No {PROGRAM_TYPE_LABELS[pickProgramFor.program_type]} programs
                      exist in this school year.
                    </p>
                  )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPickProgramFor(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!pickedProgramId}
                onClick={handleConfirmProgramPick}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign + term dates modal ── */}
      {assignModal && selectedSchoolYearId && (
        <AssignTemplateModal
          schoolYearId={selectedSchoolYearId}
          templates={templates}
          existingAssignment={assignModal.existingAssignment}
          programId={assignModal.programId}
          programName={assignModal.programName}
          onClose={() => setAssignModal(null)}
        />
      )}

      {/* ── Manage assignment modal (from Assignments view) ── */}
      {manageModal && selectedSchoolYearId && (
        <AssignTemplateModal
          schoolYearId={selectedSchoolYearId}
          templates={templates}
          existingAssignment={manageModal}
          programId={manageModal.program_id}
          programName={manageModal.program.name}
          onClose={() => setManageModal(null)}
        />
      )}

      {/* ── Create / Edit template modal ── */}
      {modalTemplate !== undefined && (
        <SemesterTemplateFormModal
          template={modalTemplate}
          onClose={() => setModalTemplate(undefined)}
        />
      )}

      {/* ── Delete confirm ── */}
      {pendingDelete && (
        <div className="modal-overlay" onClick={() => setPendingDelete(null)}>
          <div
            className="modal-panel modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Delete Semester Template</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete{' '}
                <strong>{pendingDelete.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterTemplatePage;