// client/src/modules/admin/system/components/semester-template/AssignTemplateModal.tsx

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/Modal/Modal';
import Button from '@/components/Button/Button';
import ConfirmationModal from '@/components/ConfirmationModal';
import TermDateRow from './TermDateRow';
import {
  useAssignSemesterTemplate,
  useSaveTermDates,
  useRemoveSemesterTemplateAssignment,
} from '../../hooks/useSemesterTemplates';
import type {
  SemesterTemplate,
  SemesterTemplateAssignment,
  TermDateMap,
} from '../../types/semester-template.types';
import { PROGRAM_TYPE_LABELS } from '../../types/semester-template.types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SchoolYear {
  id: string;
  name: string;
}

export interface Program {
  id: string;
  name: string;
  type: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildTermDateMap(assignment: SemesterTemplateAssignment): TermDateMap {
  const map: TermDateMap = {};
  for (const td of assignment.termDates) {
    map[td.term_id] = {
      startDate: td.start_date.slice(0, 10),
      endDate: td.end_date.slice(0, 10),
    };
  }
  return map;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AssignTemplateModalProps {
  /** The template being assigned */
  template: SemesterTemplate;
  /** All templates for the org (for template switcher) */
  allTemplates: SemesterTemplate[];
  /** Already existing assignment for the selected program, if any */
  existingAssignment?: SemesterTemplateAssignment | null;
  /** Pre-selected program (from template card flow). null = user must pick */
  programId?: string | null;
  programName?: string | null;
  /** School years for the picker */
  schoolYears: SchoolYear[];
  /** Pre-selected school year id — can be null if none selected yet */
  selectedSchoolYearId: string | null;
  /** Programs within the selected school year filtered by template type */
  programs: Program[];
  programsLoading: boolean;
  onClose: () => void;
}

const AssignTemplateModal: React.FC<AssignTemplateModalProps> = ({
  template,
  allTemplates,
  existingAssignment,
  programId: initialProgramId,
  programName: initialProgramName,
  schoolYears,
  selectedSchoolYearId: initialSchoolYearId,
  programs,
  programsLoading,
  onClose,
}) => {
  const assignMutation = useAssignSemesterTemplate();
  const saveTermDatesMutation = useSaveTermDates();
  const removeMutation = useRemoveSemesterTemplateAssignment();

  // ── Local state ────────────────────────────────────────────────────────────

  const [schoolYearId, setSchoolYearId] = useState<string>(
    initialSchoolYearId ?? '',
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    existingAssignment?.template_id ?? template.id,
  );
  const [programId, setProgramId] = useState<string>(initialProgramId ?? '');
  const [termDateMap, setTermDateMap] = useState<TermDateMap>(
    existingAssignment ? buildTermDateMap(existingAssignment) : {},
  );

  // Confirm save dialog
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  // Confirm remove dialog
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedTemplate =
    allTemplates.find((t) => t.id === selectedTemplateId) ?? template;

  const isSaving = assignMutation.isPending || saveTermDatesMutation.isPending;

  const filteredPrograms = useMemo(
    () => programs.filter((p) => p.type === selectedTemplate.program_type),
    [programs, selectedTemplate.program_type],
  );

  const allTerms = useMemo(() => {
    return selectedTemplate.semesters.flatMap((sem) =>
      sem.terms.map((t) => ({ term: t, semesterName: sem.name })),
    );
  }, [selectedTemplate]);

  const selectedProgramName = useMemo(() => {
    if (initialProgramName) return initialProgramName;
    return programs.find((p) => p.id === programId)?.name ?? '';
  }, [programs, programId, initialProgramName]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTermDateChange = (
    termId: string,
    field: 'startDate' | 'endDate',
    val: string,
  ) => {
    setTermDateMap((prev) => ({
      ...prev,
      [termId]: {
        startDate: prev[termId]?.startDate ?? '',
        endDate: prev[termId]?.endDate ?? '',
        [field]: val,
      },
    }));
  };

  const handleSaveConfirmed = async () => {
    setShowSaveConfirm(false);

    if (!schoolYearId) { toast.error('Select a school year first.'); return; }
    if (!programId && !initialProgramId) { toast.error('Select a program first.'); return; }

    const targetProgramId = initialProgramId ?? programId;

    try {
      await assignMutation.mutateAsync({
        programId: targetProgramId,
        templateId: selectedTemplateId,
      });

      const termDates = Object.entries(termDateMap)
        .filter(([, v]) => v.startDate && v.endDate)
        .map(([termId, v]) => ({
          termId,
          startDate: v.startDate,
          endDate: v.endDate,
        }));

      if (termDates.length > 0) {
        await saveTermDatesMutation.mutateAsync({
          programId: targetProgramId,
          data: { termDates },
        });
      }

      toast.success('Template assigned successfully.');
      onClose();
    } catch {
      // handled by apiClient interceptor
    }
  };

  const handleRemoveConfirmed = async () => {
    const targetProgramId = initialProgramId ?? programId;
    setShowRemoveConfirm(false);
    try {
      await removeMutation.mutateAsync(targetProgramId);
      toast.success('Assignment removed.');
      onClose();
    } catch {
      // handled by apiClient interceptor
    }
  };

  const handleSaveClick = () => {
    if (!schoolYearId) { toast.error('Select a school year first.'); return; }
    const targetProgramId = initialProgramId ?? programId;
    if (!targetProgramId) { toast.error('Select a program first.'); return; }
    setShowSaveConfirm(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const needsSchoolYear = !initialSchoolYearId;
  const needsProgram = !initialProgramId;

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title={`Assign Template — ${selectedProgramName || 'Select Program'}`}
        size="lg"
        closeOnOverlayClick={!isSaving}
      >
        {/* ── School year picker (only if not pre-selected) ── */}
        {needsSchoolYear && (
          <div className="form-group">
            <label className="form-label">School Year</label>
            <div className="program-select-wrapper">
              <select
                className="program-select"
                value={schoolYearId}
                onChange={(e) => {
                  setSchoolYearId(e.target.value);
                  setProgramId('');
                }}
                disabled={isSaving}
              >
                <option value="">Select school year…</option>
                {schoolYears.map((sy) => (
                  <option key={sy.id} value={sy.id}>
                    {sy.name}
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

        {/* ── Template selector ── */}
        <div className="form-group">
          <label className="form-label">Semester Template</label>
          <div className="program-select-wrapper">
            <select
              className="program-select"
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                setTermDateMap({});
                setProgramId('');
              }}
              disabled={isSaving}
            >
              {allTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {PROGRAM_TYPE_LABELS[t.program_type]}
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

        {/* ── Program picker (only if not pre-selected) ── */}
        {needsProgram && (
          <div className="form-group">
            <label className="form-label">Program</label>
            {programsLoading ? (
              <div className="program-select__skeleton" />
            ) : (
              <div className="program-select-wrapper">
                <select
                  className="program-select"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  disabled={isSaving || !schoolYearId}
                >
                  <option value="">
                    {!schoolYearId
                      ? 'Select a school year first…'
                      : filteredPrograms.length === 0
                      ? `No ${PROGRAM_TYPE_LABELS[selectedTemplate.program_type]} programs in this school year`
                      : 'Select program…'}
                  </option>
                  {filteredPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="program-select__chevron" aria-hidden="true">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Template structure preview ── */}
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

        {/* ── Term dates ── */}
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
                  value={termDateMap[term.id] ?? { startDate: '', endDate: '' }}
                  onChange={handleTermDateChange}
                  disabled={isSaving}
                />
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          {existingAssignment && (
            <Button
              variant="error"
              onClick={() => setShowRemoveConfirm(true)}
              disabled={isSaving || removeMutation.isPending}
            >
              {removeMutation.isPending ? 'Removing…' : 'Remove Assignment'}
            </Button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveClick} loading={isSaving}>
              Save Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm: save ── */}
      <ConfirmationModal
        isOpen={showSaveConfirm}
        title="Confirm Assignment"
        message={`Assign "${selectedTemplate.name}" to "${selectedProgramName}"? This will overwrite any existing assignment for this program.`}
        confirmLabel="Yes, Assign"
        cancelLabel="Cancel"
        isLoading={isSaving}
        onConfirm={handleSaveConfirmed}
        onClose={() => setShowSaveConfirm(false)}
      />

      {/* ── Confirm: remove ── */}
      <ConfirmationModal
        isOpen={showRemoveConfirm}
        title="Remove Assignment"
        message={`Remove the template assignment from "${selectedProgramName}"? Term dates will also be deleted.`}
        confirmLabel="Yes, Remove"
        cancelLabel="Cancel"
        isLoading={removeMutation.isPending}
        onConfirm={handleRemoveConfirmed}
        onClose={() => setShowRemoveConfirm(false)}
      />
    </>
  );
};

export default AssignTemplateModal;