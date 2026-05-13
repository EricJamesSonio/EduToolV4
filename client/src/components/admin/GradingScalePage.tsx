// ===== client/src/components/admin/GradingScalePage.tsx =====

import { useState } from 'react';
import { toast } from 'sonner';
import {
  useGradingScales,
  useCreateGradingScale,
  useUpdateGradingScale,
  useDeleteGradingScale,
} from '../../hooks/useGradingScales';
import { useSchoolYears } from '../../modules/admin/academic/hooks/useSchoolYears';
import { useProgramsBySchoolYear } from '../../hooks/usePrograms';
import SchoolYearSelector from '../shared/SchoolYearSelector';
import type {
  GradingScale,
  GradeRange,
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
} from '../../types/grading-scale.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_RANGE: GradeRange = {
  minPercent: 0,
  maxPercent: 0,
  gradeValue: '',
  remark: '',
  isPassing: false,
};

// ─── GradeRangeRow ────────────────────────────────────────────────────────────

interface GradeRangeRowProps {
  range: GradeRange;
  index: number;
  onChange: (index: number, updated: GradeRange) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

const GradeRangeRow: React.FC<GradeRangeRowProps> = ({ range, index, onChange, onRemove, disabled }) => {
  const set = (field: keyof GradeRange, value: unknown) =>
    onChange(index, { ...range, [field]: value });

  return (
    <div className="grade-range-row">
      <input
        type="number"
        className="form-input grade-range-input"
        min={0}
        max={100}
        value={range.minPercent}
        onChange={(e) => set('minPercent', Number(e.target.value))}
        placeholder="Min %"
        disabled={disabled}
      />
      <span className="range-dash">–</span>
      <input
        type="number"
        className="form-input grade-range-input"
        min={0}
        max={100}
        value={range.maxPercent}
        onChange={(e) => set('maxPercent', Number(e.target.value))}
        placeholder="Max %"
        disabled={disabled}
      />
      <input
        type="text"
        className="form-input grade-value-input"
        value={range.gradeValue}
        onChange={(e) => set('gradeValue', e.target.value)}
        placeholder="Grade (e.g. A, 1.0)"
        maxLength={20}
        disabled={disabled}
      />
      <input
        type="text"
        className="form-input grade-remark-input"
        value={range.remark}
        onChange={(e) => set('remark', e.target.value)}
        placeholder="Remark (e.g. Passed)"
        maxLength={100}
        disabled={disabled}
      />
      <label className="passing-toggle">
        <input
          type="checkbox"
          checked={range.isPassing}
          onChange={(e) => set('isPassing', e.target.checked)}
          disabled={disabled}
        />
        <span>Passing</span>
      </label>
      <button
        type="button"
        className="remove-range-btn"
        onClick={() => onRemove(index)}
        disabled={disabled}
        aria-label="Remove range"
      >
        ✕
      </button>
    </div>
  );
};

// ─── GradingScaleFormModal ────────────────────────────────────────────────────

interface GradingScaleFormModalProps {
  scale?: GradingScale | null;
  programId: string;
  schoolYearId: string;
  onClose: () => void;
  onSaved: () => void;
}

const GradingScaleFormModal: React.FC<GradingScaleFormModalProps> = ({
  scale,
  programId,
  schoolYearId,
  onClose,
  onSaved,
}) => {
  const isEdit = !!scale;
  const createMutation = useCreateGradingScale();
  const updateMutation = useUpdateGradingScale();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState(scale?.name ?? '');
  const [ranges, setRanges] = useState<GradeRange[]>(scale?.ranges ?? [{ ...EMPTY_RANGE }]);

  const handleRangeChange = (index: number, updated: GradeRange) =>
    setRanges((prev) => prev.map((r, i) => (i === index ? updated : r)));

  const handleRemoveRange = (index: number) =>
    setRanges((prev) => prev.filter((_, i) => i !== index));

  const handleAddRange = () =>
    setRanges((prev) => [...prev, { ...EMPTY_RANGE }]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    try {
      if (isEdit && scale) {
        const dto: UpdateGradingScaleDto = { name: name.trim(), ranges };
        await updateMutation.mutateAsync({ id: scale.id, data: dto });
        toast.success('Grading scale updated.');
      } else {
        const dto: CreateGradingScaleDto = { programId, schoolYearId, name: name.trim(), ranges };
        await createMutation.mutateAsync(dto);
        toast.success('Grading scale created.');
      }
      onSaved();
      onClose();
    } catch {
      // apiClient interceptor handles toast
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Grading Scale' : 'New Grading Scale'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Scale Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard GPA Scale"
              maxLength={100}
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <div className="ranges-header">
              <label className="form-label">Grade Ranges</label>
              <button type="button" className="add-range-btn" onClick={handleAddRange} disabled={isSaving}>
                + Add Range
              </button>
            </div>

            <div className="ranges-column-labels">
              <span>Min %</span>
              <span />
              <span>Max %</span>
              <span>Grade</span>
              <span>Remark</span>
              <span>Passing</span>
              <span />
            </div>

            <div className="ranges-list">
              {ranges.map((range, i) => (
                <GradeRangeRow
                  key={i}
                  range={range}
                  index={i}
                  onChange={handleRangeChange}
                  onRemove={handleRemoveRange}
                  disabled={isSaving}
                />
              ))}
              {ranges.length === 0 && (
                <p className="empty-ranges-hint">No ranges yet. Click "Add Range" to begin.</p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Scale'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── GradingScaleCard ─────────────────────────────────────────────────────────

interface GradingScaleCardProps {
  scale: GradingScale;
  onEdit: (scale: GradingScale) => void;
  onDelete: (scale: GradingScale) => void;
}

const GradingScaleCard: React.FC<GradingScaleCardProps> = ({ scale, onEdit, onDelete }) => {
  const passingRanges = scale.ranges.filter((r) => r.isPassing);
  const failingRanges = scale.ranges.filter((r) => !r.isPassing);

  return (
    <div className={`grading-scale-card card${scale.isLocked ? ' is-locked' : ''}`}>
      <div className="scale-card-header">
        <div>
          <h4 className="scale-name">{scale.name}</h4>
          <span className="scale-range-count">
            {scale.ranges.length} range{scale.ranges.length !== 1 ? 's' : ''}
          </span>
        </div>
        {scale.isLocked ? (
          <span className="locked-badge">🔒 Locked</span>
        ) : (
          <div className="scale-card-actions action-buttons action-buttons-sm">
            <button type="button" className="action-button action-button-edit" onClick={() => onEdit(scale)}>
              Edit
            </button>
            <button type="button" className="action-button action-button-delete" onClick={() => onDelete(scale)}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="ranges-preview">
        {scale.ranges
          .slice()
          .sort((a, b) => b.minPercent - a.minPercent)
          .map((r, i) => (
            <div key={i} className={`range-chip ${r.isPassing ? 'passing' : 'failing'}`}>
              <span className="range-chip-grade">{r.gradeValue}</span>
              <span className="range-chip-pct">{r.minPercent}–{r.maxPercent}%</span>
              <span className="range-chip-remark">{r.remark}</span>
            </div>
          ))}
      </div>

      <div className="scale-card-footer">
        <span className="scale-stat passing">✓ {passingRanges.length} passing</span>
        <span className="scale-stat failing">✗ {failingRanges.length} failing</span>
        {scale.lockedAt && (
          <span className="scale-locked-at">
            Locked {new Date(scale.lockedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

interface GradingScalePageProps {
  onBack: () => void;
}

const GradingScalePage: React.FC<GradingScalePageProps> = ({ onBack }) => {
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [programId, setProgramId] = useState('');
  const [modalScale, setModalScale] = useState<GradingScale | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<GradingScale | null>(null);

  const { data: schoolYears = [], isLoading: schoolYearsLoading } = useSchoolYears();
  const { data: programs = [], isLoading: programsLoading } = useProgramsBySchoolYear(
    selectedSchoolYearId ?? '',
  );
  const { data: scales = [], isLoading: scalesLoading } = useGradingScales(
    programId && selectedSchoolYearId
      ? { programId, schoolYearId: selectedSchoolYearId }
      : undefined,
  );
  const deleteMutation = useDeleteGradingScale();

  const handleSchoolYearSelect = (id: string) => {
    setSelectedSchoolYearId(id);
    setProgramId('');
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Grading scale deleted.');
    } catch {
      // handled by apiClient
    } finally {
      setPendingDelete(null);
    }
  };

  const selectedProgram = programs.find((p) => p.id === programId);

  return (
    <div className="system-detail-page">
      <div className="view-container">
        <div className="view-header">
          <button type="button" onClick={onBack} className="back-button">
            Back to System
          </button>
          <div className="header-title">
            <h2 className="dashboard-section-title">Grading Scales</h2>
            <p className="dashboard-section-subtitle">
              Define grade ranges per program and school year.
            </p>
          </div>
        </div>
      </div>

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

          <div className="form-group filter-group">
            <label className="form-label">Program</label>
            {programsLoading ? (
              <div className="program-select-wrapper">
                <div className="program-select__skeleton" />
              </div>
            ) : (
              <div className="program-select-wrapper">
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  disabled={!selectedSchoolYearId || programs.length === 0}
                  className="program-select"
                >
                  <option value="">
                    {!selectedSchoolYearId
                      ? 'Select a school year first'
                      : programs.length === 0
                      ? 'No programs found'
                      : 'Select program…'}
                  </option>
                  {programs.map((p) => (
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

          <button
            type="button"
            className="btn-primary"
            disabled={!programId || !selectedSchoolYearId}
            onClick={() => setModalScale(null)}
          >
            + New Scale
          </button>
        </div>
      </div>

      <div className="grading-scales-grid">
        {scalesLoading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            <span className="loading-text">Loading grading scales…</span>
          </div>
        ) : !programId || !selectedSchoolYearId ? (
          <div className="empty-state">
            <p>Select a school year and program above to view or create grading scales.</p>
          </div>
        ) : scales.length === 0 ? (
          <div className="empty-state">
            <p>
              No grading scales found for{' '}
              <strong>{selectedProgram?.name ?? 'this program'}</strong>.
            </p>
            <button type="button" className="btn-primary" onClick={() => setModalScale(null)}>
              Create First Scale
            </button>
          </div>
        ) : (
          scales.map((scale) => (
            <GradingScaleCard
              key={scale.id}
              scale={scale}
              onEdit={(s) => setModalScale(s)}
              onDelete={(s) => setPendingDelete(s)}
            />
          ))
        )}
      </div>

      {modalScale !== undefined && selectedSchoolYearId && (
        <GradingScaleFormModal
          scale={modalScale}
          programId={programId}
          schoolYearId={selectedSchoolYearId}
          onClose={() => setModalScale(undefined)}
          onSaved={() => setModalScale(undefined)}
        />
      )}

      {pendingDelete && (
        <div className="modal-overlay" onClick={() => setPendingDelete(null)}>
          <div className="modal-panel modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Grading Scale</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{pendingDelete.name}</strong>?
                This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setPendingDelete(null)}>
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

export default GradingScalePage;