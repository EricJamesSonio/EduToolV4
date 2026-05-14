// client/src/modules/admin/system/components/semester-template/SemesterTemplateFormModal.tsx

import React, { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/Modal/Modal';
import Button from '@/components/Button/Button';
import {
  useCreateSemesterTemplate,
  useUpdateSemesterTemplate,
} from '../../hooks/useSemesterTemplates';
import type {
  SemesterTemplate,
  ProgramType,
  CreateSemesterTemplateDto,
  UpdateSemesterTemplateDto,
} from '../../types/semester-template.types';
import { PROGRAM_TYPE_LABELS } from '../../types/semester-template.types';

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

// ── Component ─────────────────────────────────────────────────────────────────

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
      : [{ name: '', orderIndex: 1, terms: [{ ...EMPTY_TERM }] }],
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
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Semester Template' : 'New Semester Template'}
      size="lg"
      closeOnOverlayClick={!isSaving}
    >
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

      <div className="form-actions">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} loading={isSaving}>
          {isEdit ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </Modal>
  );
};

export default SemesterTemplateFormModal;