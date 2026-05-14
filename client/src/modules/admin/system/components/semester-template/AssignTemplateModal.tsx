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
import type { Program } from '@/modules/admin/academic/types/program.types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SchoolYearOption {
  id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildTermDateMap(assignment: SemesterTemplateAssignment): TermDateMap {
  const map: TermDateMap = {};
  for (const td of assignment.termDates) {
    map[td.term_id] = {
      startDate: td.start_date.slice(0, 10),
      endDate:   td.end_date.slice(0, 10),
    };
  }
  return map;
}

function toInputDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface AssignTemplateModalProps {
  program: Program;
  availableTemplates: SemesterTemplate[];
  existingAssignment?: SemesterTemplateAssignment | null;
  schoolYear: SchoolYearOption;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

const AssignTemplateModal: React.FC<AssignTemplateModalProps> = ({
  program,
  availableTemplates,
  existingAssignment,
  schoolYear,
  onClose,
}) => {
  const assignMutation        = useAssignSemesterTemplate();
  const saveTermDatesMutation = useSaveTermDates();
  const removeMutation        = useRemoveSemesterTemplateAssignment();

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    existingAssignment?.template_id ?? availableTemplates[0]?.id ?? '',
  );
  const [termDateMap, setTermDateMap] = useState<TermDateMap>(
    existingAssignment ? buildTermDateMap(existingAssignment) : {},
  );
  const [showSaveConfirm,   setShowSaveConfirm]   = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const selectedTemplate = availableTemplates.find((t) => t.id === selectedTemplateId);
  const isSaving         = assignMutation.isPending || saveTermDatesMutation.isPending;

  const allTerms = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.semesters.flatMap((sem) =>
      sem.terms.map((t) => ({ term: t, semesterName: sem.name })),
    );
  }, [selectedTemplate]);

  const dateMin = toInputDate(schoolYear.start_date);
  const dateMax = toInputDate(schoolYear.end_date);

  const allDatesFilled = useMemo(
    () => allTerms.every(({ term }) => {
      const v = termDateMap[term.id];
      return v?.startDate && v?.endDate;
    }),
    [allTerms, termDateMap],
  );

  const handleTermDateChange = (
    termId: string,
    field: 'startDate' | 'endDate',
    val: string,
  ) => {
    setTermDateMap((prev) => ({
      ...prev,
      [termId]: {
        startDate: prev[termId]?.startDate ?? '',
        endDate:   prev[termId]?.endDate   ?? '',
        [field]:   val,
      },
    }));
  };

  const handleSaveClick = () => {
    if (!selectedTemplateId) { toast.error('Select a template first.'); return; }
    if (allTerms.length > 0 && !allDatesFilled) {
      toast.error('Fill in all term dates before saving.');
      return;
    }
    setShowSaveConfirm(true);
  };

  const handleSaveConfirmed = async () => {
    setShowSaveConfirm(false);
    try {
      await assignMutation.mutateAsync({
        programId:  program.id,
        templateId: selectedTemplateId,
      });

      const termDates = Object.entries(termDateMap)
        .filter(([, v]) => v.startDate && v.endDate)
        .map(([termId, v]) => ({
          termId,
          startDate: v.startDate,
          endDate:   v.endDate,
        }));

      if (termDates.length > 0) {
        await saveTermDatesMutation.mutateAsync({
          programId: program.id,
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
    setShowRemoveConfirm(false);
    try {
      await removeMutation.mutateAsync(program.id);
      toast.success('Assignment removed.');
      onClose();
    } catch {
      // handled by apiClient interceptor
    }
  };

  // ── No templates available ────────────────────────────────────────────────────

  if (availableTemplates.length === 0) {
    return (
      <Modal isOpen onClose={onClose} title={`Assign Template — ${program.name}`} size="sm">
        <div className="empty-state">
          <p>
            No semester templates available for{' '}
            <strong>{PROGRAM_TYPE_LABELS[program.type]}</strong> programs.
          </p>
          <p className="empty-ranges-hint">
            Create a template with the matching program type first.
          </p>
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  // ── Main modal ────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title={`Assign Template — ${program.name}`}
        size="lg"
        closeOnOverlayClick={!isSaving}
      >
        <div className="assign-modal-scroll-body">

          {/* School year context banner */}
          {(schoolYear.start_date || schoolYear.end_date) && (
            <div className="school-year-date-banner">
              <span className="banner-label">School Year:</span>
              <span className="banner-value">{schoolYear.name}</span>
              {schoolYear.start_date && schoolYear.end_date && (
                <span className="banner-range">
                  {toInputDate(schoolYear.start_date)} → {toInputDate(schoolYear.end_date)}
                </span>
              )}
            </div>
          )}

          {/* Template selector */}
          <div className="form-group">
            <label className="form-label">
              Semester Template
              <span className="form-label-hint">
                &nbsp;({PROGRAM_TYPE_LABELS[program.type]} only)
              </span>
            </label>
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
                {availableTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
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
                        <span key={t.id} className="template-term-chip">{t.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Term dates with school year range constraint */}
          {allTerms.length > 0 && (
            <div className="form-group">
              <label className="form-label">
                Term Dates
                {(dateMin || dateMax) && (
                  <span className="form-label-hint">
                    &nbsp;— dates must be within school year range
                  </span>
                )}
              </label>
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
                    dateMin={dateMin}
                    dateMax={dateMax}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="assign-modal-footer">
          {existingAssignment && (
            <Button
              variant="error"
              onClick={() => setShowRemoveConfirm(true)}
              disabled={isSaving || removeMutation.isPending}
            >
              Remove Assignment
            </Button>
          )}
          <div className="assign-modal-footer-right">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveClick} loading={isSaving}>
              Save Assignment
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={showSaveConfirm}
        title="Confirm Assignment"
        message={`Assign "${selectedTemplate?.name}" to "${program.name}"?${existingAssignment ? ' This will replace the existing assignment.' : ''}`}
        confirmLabel="Yes, Assign"
        cancelLabel="Cancel"
        isLoading={isSaving}
        onConfirm={handleSaveConfirmed}
        onClose={() => setShowSaveConfirm(false)}
      />

      <ConfirmationModal
        isOpen={showRemoveConfirm}
        title="Remove Assignment"
        message={`Remove the semester template assignment from "${program.name}"? All term dates will also be deleted.`}
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