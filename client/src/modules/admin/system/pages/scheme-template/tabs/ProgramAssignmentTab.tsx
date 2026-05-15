import { useState, useMemo } from 'react';
import SchoolYearSelector from '@/components/shared/SchoolYearSelector';
import { useSchoolYears } from '@/modules/admin/academic/hooks/useSchoolYears';
import { useProgramsWithStats } from '@/modules/admin/academic/hooks/usePrograms';
import { useAllGradingSchemeTemplates } from '../../../hooks/useGradingSchemeTemplates';
import { useApplyTemplateToProgram } from '../../../hooks/useGradingSchemes';
import { getProgramTypeLabel } from '@/modules/admin/academic/constants/programTypes';
import { useErrorToast } from '@/components/ErrorDisplay/UnifiedError';
import type { GradingSchemeTemplate } from '../../../types/grading-scheme.types';
import type { ProgramWithStats } from '@/modules/admin/academic/types/program.types';

// A program row with its matched template (if any)
type ProgramRow = {
  program: ProgramWithStats;
  matchedTemplate: GradingSchemeTemplate | null;
};

// ─── ConfirmAssignModal ───────────────────────────────────────────────────────

type ConfirmAssignModalProps = {
  program: ProgramWithStats;
  template: GradingSchemeTemplate;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmAssignModal: React.FC<ConfirmAssignModalProps> = ({
  program, template, isLoading, onConfirm, onCancel,
}) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3 className="modal-title">Assign Grading Scheme</h3>
      </div>
      <div className="modal-body">
        <p className="modal-description">
          Are you sure you want to apply{' '}
          <strong>"{template.name}"</strong> to all classes under{' '}
          <strong>{program.name}</strong>?
        </p>
        <p className="modal-description" style={{ marginTop: '0.5rem' }}>
          This will create or overwrite the grading scheme for every class in this program.
        </p>
      </div>
      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Applying…' : 'Yes, Apply'}
        </button>
      </div>
    </div>
  </div>
);

// ─── ProgramAssignmentRow ─────────────────────────────────────────────────────

type ProgramAssignmentRowProps = {
  row: ProgramRow;
  isMutating: boolean;
  onAssign: (program: ProgramWithStats, template: GradingSchemeTemplate) => void;
};

const ProgramAssignmentRow: React.FC<ProgramAssignmentRowProps> = ({
  row, isMutating, onAssign,
}) => {
  const { program, matchedTemplate } = row;
  const hasTemplate = matchedTemplate !== null;

  return (
    <div className="gs-assignment-row">
      <div className="gs-assignment-row-info">
        <span className="gs-assignment-program-name">{program.name}</span>
        <span className="gs-assignment-program-type">
          {getProgramTypeLabel(program.type)}
        </span>
      </div>

      <div className="gs-assignment-row-status">
        {hasTemplate ? (
          <>
            <span className="gs-assignment-template-name">
              {matchedTemplate!.name}
            </span>
            <span className="status-badge status-default">Template matched</span>
          </>
        ) : (
          <span className="status-badge status-warning">No matching template</span>
        )}
      </div>

      <div className="gs-assignment-row-action">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!hasTemplate || isMutating}
          onClick={() => {
            if (matchedTemplate) onAssign(program, matchedTemplate);
          }}
          title={
            !hasTemplate
              ? `No template found for program type "${getProgramTypeLabel(program.type)}". Create one in the Templates tab first.`
              : undefined
          }
        >
          Assign
        </button>
      </div>
    </div>
  );
};

// ─── ProgramAssignmentTab ─────────────────────────────────────────────────────

const ProgramAssignmentTab: React.FC = () => {
  const { showError, showSuccess } = useErrorToast();

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    program: ProgramWithStats;
    template: GradingSchemeTemplate;
  } | null>(null);

  const { data: schoolYears = [], isLoading: schoolYearsLoading } = useSchoolYears();

  const { data: programs = [], isLoading: programsLoading } = useProgramsWithStats(
    selectedSchoolYearId ?? '',
  );

  const { data: templates = [], isLoading: templatesLoading } = useAllGradingSchemeTemplates();

  const applyMutation = useApplyTemplateToProgram();

  // For each program, find the first template whose programType matches the program type.
  // Falls back to a general template (no programType) if no specific match.
  const programRows = useMemo((): ProgramRow[] => {
    return programs.map((program) => {
      const specific = templates.find(
        (t) => t.programType === program.type,
      ) ?? null;
      const general = templates.find((t) => !t.programType) ?? null;
      return {
        program,
        matchedTemplate: specific ?? general,
      };
    });
  }, [programs, templates]);

  const handleAssignClick = (
    program: ProgramWithStats,
    template: GradingSchemeTemplate,
  ) => {
    setConfirmTarget({ program, template });
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    try {
      const result = await applyMutation.mutateAsync({
        programId: confirmTarget.program.id,
        templateId: confirmTarget.template.id,
      });
      showSuccess(
        `Applied to ${result.applied} class${result.applied !== 1 ? 'es' : ''}.` +
          (result.skipped > 0 ? ` ${result.skipped} skipped.` : ''),
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to apply grading scheme.';
      showError(message);
    } finally {
      setConfirmTarget(null);
    }
  };

  const isLoading = schoolYearsLoading || programsLoading || templatesLoading;

  return (
    <>
      <div className="gs-assignment-tab">
        <div className="gs-assignment-selector-row">
          <SchoolYearSelector
            schoolYears={schoolYears}
            isLoading={schoolYearsLoading}
            selectedId={selectedSchoolYearId}
            onSelect={setSelectedSchoolYearId}
          />
        </div>

        {!selectedSchoolYearId && (
          <p className="system-section-note">Select a school year to view programs.</p>
        )}

        {selectedSchoolYearId && isLoading && (
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            <span className="loading-text">Loading programs…</span>
          </div>
        )}

        {selectedSchoolYearId && !isLoading && programs.length === 0 && (
          <div className="grading-scheme-empty">
            No programs found for this school year.
          </div>
        )}

        {selectedSchoolYearId && !isLoading && programs.length > 0 && (
          <div className="gs-assignment-list">
            <div className="gs-assignment-list-header">
              <span>Program</span>
              <span>Matched Template</span>
              <span>Action</span>
            </div>
            {programRows.map((row) => (
              <ProgramAssignmentRow
                key={row.program.id}
                row={row}
                isMutating={applyMutation.isPending}
                onAssign={handleAssignClick}
              />
            ))}
          </div>
        )}
      </div>

      {confirmTarget && (
        <ConfirmAssignModal
          program={confirmTarget.program}
          template={confirmTarget.template}
          isLoading={applyMutation.isPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </>
  );
};

export default ProgramAssignmentTab;