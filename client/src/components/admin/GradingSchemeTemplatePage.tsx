// GradingSchemeTemplatePage
// Admin page for managing reusable grading scheme templates.

import { useState, useCallback } from 'react';
import {
  useGradingSchemeTemplates,
  useCreateGradingSchemeTemplate,
  useUpdateGradingSchemeTemplate,
  useDeleteGradingSchemeTemplate,
} from '../../hooks/useGradingSchemeTemplates';
import { PROGRAM_TYPES, getProgramTypeLabel } from '../../constants/programTypes';
import {
  COMPONENT_TYPES,
  COMPONENT_TYPE_LABELS,
} from '../../types/grading-scheme.types';
import type {
  GradingSchemeTemplate,
  ComponentFormRow,
  TemplateFormState,
  ComponentType,
} from '../../types/grading-scheme.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_COMPONENT = (): ComponentFormRow => ({
  name: '',
  type: 'written_work',
  weight: '',
  maxScore: '',
});

const EMPTY_FORM = (): TemplateFormState => ({
  name: '',
  programType: '',
  components: [EMPTY_COMPONENT()],
});

const ALL_FILTER = '__all__';
const GENERAL_FILTER = '__general__';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sumWeights(rows: ComponentFormRow[]): number {
  return rows.reduce(
    (acc, r) => acc + (typeof r.weight === 'number' ? r.weight : 0),
    0,
  );
}

function formToDto(form: TemplateFormState) {
  return {
    name: form.name.trim(),
    programType: form.programType || undefined,
    components: form.components.map((r) => ({
      name: r.name.trim(),
      type: r.type,
      weight: typeof r.weight === 'number' ? r.weight : 0,
      maxScore: typeof r.maxScore === 'number' ? r.maxScore : undefined,
    })),
  };
}

function templateToForm(t: GradingSchemeTemplate): TemplateFormState {
  return {
    name: t.name,
    programType: t.programType ?? '',
    components: t.components.map((c) => ({
      name: c.name,
      type: c.type,
      weight: c.weight,
      maxScore: c.maxScore ?? '',
    })),
  };
}

function validateForm(form: TemplateFormState): string | null {
  if (!form.name.trim()) return 'Template name is required.';
  if (form.components.length === 0) return 'At least one component is required.';
  for (const [i, c] of form.components.entries()) {
    if (!c.name.trim()) return `Component ${i + 1}: name is required.`;
    if (typeof c.weight !== 'number' || c.weight < 1 || c.weight > 100)
      return `Component ${i + 1}: weight must be between 1 and 100.`;
  }
  const total = sumWeights(form.components);
  if (Math.round(total) !== 100)
    return `Weights must total exactly 100%. Current total: ${total}%.`;
  return null;
}

// ─── WeightBar ────────────────────────────────────────────────────────────────

const WeightBar: React.FC<{ total: number }> = ({ total }) => {
  const clamped = Math.min(total, 100);
  const isExact = Math.round(total) === 100;
  const isOver = total > 100;

  return (
    <div className="grading-scheme-weight-bar-wrap">
      <div className="grading-scheme-weight-bar-label">
        <span>Weight total</span>
        <strong className={isExact ? 'is-valid' : 'is-invalid'}>
          {total}% / 100%
        </strong>
      </div>
      <div className="grading-scheme-weight-bar-track">
        <div
          className={[
            'grading-scheme-weight-bar-fill',
            isOver ? 'is-over' : '',
            isExact ? 'is-exact' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

// ─── ComponentRow ─────────────────────────────────────────────────────────────

interface ComponentRowProps {
  row: ComponentFormRow;
  index: number;
  isFirst: boolean;
  canRemove: boolean;
  onChange: (index: number, field: keyof ComponentFormRow, value: string | number | '') => void;
  onRemove: (index: number) => void;
}

const ComponentRow: React.FC<ComponentRowProps> = ({
  row,
  index,
  isFirst,
  canRemove,
  onChange,
  onRemove,
}) => (
  <div className="grading-scheme-component-row">
    <div className="grading-scheme-form-field">
      {isFirst && <label>Name</label>}
      <input
        type="text"
        placeholder="e.g. Written Work"
        value={row.name}
        maxLength={100}
        onChange={(e) => onChange(index, 'name', e.target.value)}
      />
    </div>

    <div className="grading-scheme-form-field">
      {isFirst && <label>Type</label>}
      <select
        value={row.type}
        onChange={(e) => onChange(index, 'type', e.target.value as ComponentType)}
      >
        {COMPONENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {COMPONENT_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
    </div>

    <div className="grading-scheme-form-field">
      {isFirst && <label>Weight %</label>}
      <input
        type="number"
        placeholder="0"
        min={1}
        max={100}
        value={row.weight}
        onChange={(e) =>
          onChange(index, 'weight', e.target.value === '' ? '' : Number(e.target.value))
        }
      />
    </div>

    <div className="grading-scheme-form-field">
      {isFirst && <label>Max Score</label>}
      <input
        type="number"
        placeholder="—"
        min={0}
        value={row.maxScore}
        onChange={(e) =>
          onChange(index, 'maxScore', e.target.value === '' ? '' : Number(e.target.value))
        }
      />
    </div>

    <button
      type="button"
      className="grading-scheme-component-remove"
      onClick={() => onRemove(index)}
      disabled={!canRemove}
      title="Remove"
      style={{ alignSelf: isFirst ? 'flex-end' : 'center' }}
    >
      ×
    </button>
  </div>
);

// ─── TemplateFormPanel ────────────────────────────────────────────────────────

interface TemplateFormPanelProps {
  form: TemplateFormState;
  isSubmitting: boolean;
  error: string | null;
  isEdit: boolean;
  onFormChange: (form: TemplateFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const TemplateFormPanel: React.FC<TemplateFormPanelProps> = ({
  form,
  isSubmitting,
  error,
  isEdit,
  onFormChange,
  onSubmit,
  onCancel,
}) => {
  const weightTotal = sumWeights(form.components);

  const handleComponentChange = useCallback(
    (index: number, field: keyof ComponentFormRow, value: string | number | '') => {
      const updated = form.components.map((r, i) =>
        i === index ? { ...r, [field]: value } : r,
      );
      onFormChange({ ...form, components: updated });
    },
    [form, onFormChange],
  );

  const handleAdd = useCallback(() => {
    onFormChange({ ...form, components: [...form.components, EMPTY_COMPONENT()] });
  }, [form, onFormChange]);

  const handleRemove = useCallback(
    (index: number) => {
      onFormChange({
        ...form,
        components: form.components.filter((_, i) => i !== index),
      });
    },
    [form, onFormChange],
  );

  return (
    <div className="grading-scheme-form-panel">
      <h3 className="grading-scheme-form-title">
        {isEdit ? 'Edit Template' : 'New Grading Scheme Template'}
      </h3>

      <div className="grading-scheme-form-row">
        <div className="grading-scheme-form-field">
          <label htmlFor="gs-name">Template Name</label>
          <input
            id="gs-name"
            type="text"
            placeholder="e.g. Standard Grading (College)"
            value={form.name}
            maxLength={100}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
          />
        </div>

        <div className="grading-scheme-form-field">
          <label htmlFor="gs-type">Program Type (optional)</label>
          <select
            id="gs-type"
            value={form.programType}
            onChange={(e) => onFormChange({ ...form, programType: e.target.value })}
          >
            <option value="">General — applies to all</option>
            {PROGRAM_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grading-scheme-components-section">
        <div className="grading-scheme-components-header">
          <span>Components</span>
          <button type="button" className="btn btn-sm btn-outline" onClick={handleAdd}>
            + Add Component
          </button>
        </div>

        <div className="grading-scheme-component-rows">
          {form.components.map((row, i) => (
            <ComponentRow
              key={i}
              row={row}
              index={i}
              isFirst={i === 0}
              canRemove={form.components.length > 1}
              onChange={handleComponentChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      <WeightBar total={weightTotal} />

      {error && (
        <p
          className="system-section-note"
          style={{ color: 'var(--color-error-600)', marginBottom: 'var(--spacing-4, 1rem)' }}
        >
          {error}
        </p>
      )}

      <div className="grading-scheme-form-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
        </button>
      </div>
    </div>
  );
};

// ─── TemplateCard ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: GradingSchemeTemplate;
  isEditing: boolean;
  isDeleting: boolean;
  editForm: TemplateFormState | null;
  editError: string | null;
  isSubmitting: boolean;
  onEdit: (t: GradingSchemeTemplate) => void;
  onEditFormChange: (f: TemplateFormState) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isEditing,
  isDeleting,
  editForm,
  editError,
  isSubmitting,
  onEdit,
  onEditFormChange,
  onEditSubmit,
  onEditCancel,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}) => {
  const total = template.components.reduce((s, c) => s + c.weight, 0);
  const isValid = Math.round(total) === 100;

  return (
    <div className={`grading-scheme-card${isEditing ? ' is-editing' : ''}`}>
      <div className="grading-scheme-card-header">
        <div className="grading-scheme-card-meta">
          <span className="grading-scheme-card-name">{template.name}</span>
          <span className="grading-scheme-card-type">
            {template.programType
              ? getProgramTypeLabel(template.programType)
              : 'General'}
          </span>
        </div>

        {!isEditing && !isDeleting && (
          <div className="grading-scheme-card-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => onEdit(template)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => onDeleteRequest(template.id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grading-scheme-components">
        {template.components.map((c) => (
          <div key={c.id} className="grading-scheme-component-chip">
            <strong>{c.name}</strong>
            <span>{c.weight}%</span>
          </div>
        ))}
      </div>

      <div className={`grading-scheme-weight-total${isValid ? ' is-valid' : ' is-invalid'}`}>
        Total: <strong>{total}%</strong>
      </div>

      {isEditing && editForm && (
        <div style={{ marginTop: '1.25rem' }}>
          <TemplateFormPanel
            form={editForm}
            isSubmitting={isSubmitting}
            error={editError}
            isEdit
            onFormChange={onEditFormChange}
            onSubmit={onEditSubmit}
            onCancel={onEditCancel}
          />
        </div>
      )}

      {isDeleting && (
        <div className="grading-scheme-delete-confirm">
          <span className="grading-scheme-delete-message">
            Delete <strong>{template.name}</strong>? This cannot be undone.
          </span>
          <div className="grading-scheme-delete-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={onDeleteCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => onDeleteConfirm(template.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting…' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

interface GradingSchemeTemplatePageProps {
  onBack: () => void;
}

const GradingSchemeTemplatePage: React.FC<GradingSchemeTemplatePageProps> = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<TemplateFormState>(EMPTY_FORM());
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TemplateFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const templatesQuery = useGradingSchemeTemplates();
  const createMutation = useCreateGradingSchemeTemplate();
  const updateMutation = useUpdateGradingSchemeTemplate();
  const deleteMutation = useDeleteGradingSchemeTemplate();

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const allTemplates: GradingSchemeTemplate[] = templatesQuery.data ?? [];

  const filteredTemplates =
    activeFilter === ALL_FILTER
      ? allTemplates
      : activeFilter === GENERAL_FILTER
        ? allTemplates.filter((t) => !t.programType)
        : allTemplates.filter((t) => t.programType === activeFilter);

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreateOpen = useCallback(() => {
    setCreateForm(EMPTY_FORM());
    setCreateError(null);
    setShowCreateForm(true);
    setEditingId(null);
    setDeletingId(null);
  }, []);

  const handleCreateCancel = useCallback(() => {
    setShowCreateForm(false);
    setCreateError(null);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    const err = validateForm(createForm);
    if (err) { setCreateError(err); return; }
    setCreateError(null);
    await createMutation.mutateAsync(formToDto(createForm));
    setShowCreateForm(false);
    setCreateForm(EMPTY_FORM());
  }, [createForm, createMutation]);

  // ── Edit ──────────────────────────────────────────────────────────────────

  const handleEditOpen = useCallback((t: GradingSchemeTemplate) => {
    setEditingId(t.id);
    setEditForm(templateToForm(t));
    setEditError(null);
    setShowCreateForm(false);
    setDeletingId(null);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditForm(null);
    setEditError(null);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editingId || !editForm) return;
    const err = validateForm(editForm);
    if (err) { setEditError(err); return; }
    setEditError(null);
    await updateMutation.mutateAsync({ id: editingId, data: formToDto(editForm) });
    setEditingId(null);
    setEditForm(null);
  }, [editingId, editForm, updateMutation]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteRequest = useCallback((id: string) => {
    setDeletingId(id);
    setEditingId(null);
    setShowCreateForm(false);
  }, []);

  const handleDeleteCancel = useCallback(() => setDeletingId(null), []);

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
      setDeletingId(null);
    },
    [deleteMutation],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="grading-scheme-page system-detail-page">

      {/* ── Header ── */}
      <div className="grading-scheme-page-header">
        <div className="grading-scheme-page-header-left">
          <button
            type="button"
            className="btn btn-sm btn-outline grading-scheme-page-back"
            onClick={onBack}
          >
            ← Back
          </button>
          <h2 className="grading-scheme-page-title">Grading Scheme Templates</h2>
          <p className="grading-scheme-page-description">
            Reusable grading templates scoped by program type. Components must total exactly 100%.
          </p>
        </div>

        <div className="grading-scheme-page-header-right">
          {!showCreateForm && (
            <button type="button" className="btn btn-primary" onClick={handleCreateOpen}>
              + New Template
            </button>
          )}
        </div>
      </div>

      {/* ── Create form ── */}
      {showCreateForm && (
        <TemplateFormPanel
          form={createForm}
          isSubmitting={isSubmitting}
          error={createError}
          isEdit={false}
          onFormChange={setCreateForm}
          onSubmit={handleCreateSubmit}
          onCancel={handleCreateCancel}
        />
      )}

      {/* ── Filter pills ── */}
      <div className="grading-scheme-filter-bar">
        <span className="grading-scheme-filter-label">Filter:</span>
        <div className="grading-scheme-filter-pills">
          <button
            type="button"
            className={`grading-scheme-filter-pill${activeFilter === ALL_FILTER ? ' is-active' : ''}`}
            onClick={() => setActiveFilter(ALL_FILTER)}
          >
            All
          </button>
          <button
            type="button"
            className={`grading-scheme-filter-pill${activeFilter === GENERAL_FILTER ? ' is-active' : ''}`}
            onClick={() => setActiveFilter(GENERAL_FILTER)}
          >
            General
          </button>
          {PROGRAM_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              className={`grading-scheme-filter-pill${activeFilter === pt.value ? ' is-active' : ''}`}
              onClick={() => setActiveFilter(pt.value)}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {templatesQuery.isLoading && (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <span className="loading-text">Loading templates…</span>
        </div>
      )}

      {/* ── List ── */}
      {!templatesQuery.isLoading && (
        <div className="grading-scheme-list">
          {filteredTemplates.length === 0 ? (
            <div className="grading-scheme-empty">
              No grading scheme templates found.
              {activeFilter !== ALL_FILTER && ' Try selecting a different filter.'}
            </div>
          ) : (
            filteredTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isEditing={editingId === t.id}
                isDeleting={deletingId === t.id}
                editForm={editingId === t.id ? editForm : null}
                editError={editingId === t.id ? editError : null}
                isSubmitting={isSubmitting}
                onEdit={handleEditOpen}
                onEditFormChange={setEditForm}
                onEditSubmit={handleEditSubmit}
                onEditCancel={handleEditCancel}
                onDeleteRequest={handleDeleteRequest}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={handleDeleteCancel}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GradingSchemeTemplatePage;