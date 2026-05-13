import type { ProgramWithStats } from '../../types/program.types';
import { useAddNextLevel, useLevelsBySchoolYear, useRemoveLevel } from '../../hooks/useLevels';
import { useCreateStrand, useDeleteStrand, useStrandsByProgram } from '../../hooks/useStrands';
import BaseCard from '../BaseCard';
import ConfirmationModal from '../ConfirmationModal';
import type { Level } from '../../types/level.types';
import type { Strand } from '../../types/strand.types';
import { useState } from 'react';

interface AcademicStrandPageProps {
  program: ProgramWithStats;
  schoolYearId: string;
  onBackToPrograms: () => void;
}

const AcademicStrandPage: React.FC<AcademicStrandPageProps> = ({
  program,
  schoolYearId,
  onBackToPrograms,
}) => {
  const [strandToDelete, setStrandToDelete] = useState<Strand | null>(null);
  const [levelToDelete, setLevelToDelete] = useState<Level | null>(null);
  const { data: strands = [], isLoading: isStrandsLoading } = useStrandsByProgram(schoolYearId, program.id);
  const { data: schoolYearLevels = [], isLoading: isLevelsLoading } = useLevelsBySchoolYear(schoolYearId);
  const createStrandMutation = useCreateStrand();
  const deleteStrandMutation = useDeleteStrand();
  const addNextLevelMutation = useAddNextLevel();
  const removeLevelMutation = useRemoveLevel();

  const levels = schoolYearLevels.filter((level) => level.program_id === program.id);
  const isLoading = isStrandsLoading || isLevelsLoading;

  const handleAddStrand = async () => {
    const nextNumber = strands.length + 1;
    await createStrandMutation.mutateAsync({
      schoolYearId,
      program_id: program.id,
      name: `${program.name} Strand ${nextNumber}`,
    });
  };

  const handleRemoveStrand = async () => {
    const strand = strands[strands.length - 1];
    if (!strand) return;
    setStrandToDelete(strand);
  };

  const handleAddLevel = async () => {
    await addNextLevelMutation.mutateAsync({ programId: program.id, schoolYearId });
  };

  const handleRemoveLevel = async () => {
    const level = levels[levels.length - 1];
    if (!level) return;
    setLevelToDelete(level);
  };

  const confirmRemoveStrand = async () => {
    if (!strandToDelete) return;
    await deleteStrandMutation.mutateAsync({ id: strandToDelete.id, schoolYearId, programId: program.id });
    setStrandToDelete(null);
  };

  const confirmRemoveLevel = async () => {
    if (!levelToDelete) return;
    await removeLevelMutation.mutateAsync(levelToDelete.id);
    setLevelToDelete(null);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <button onClick={onBackToPrograms} className="back-button">
          Back to Programs
        </button>
        <div className="header-title">
          <h2 className="dashboard-section-title">Strands</h2>
          <p className="dashboard-section-subtitle">{program.name}</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleAddStrand}
            className="btn btn-primary"
            disabled={createStrandMutation.isPending}
            title="Add strand"
          >
            {createStrandMutation.isPending ? '...' : '+ Strand'}
          </button>
          {strands.length > 0 && (
            <button
              onClick={handleRemoveStrand}
              className="btn btn-secondary"
              disabled={deleteStrandMutation.isPending}
              title="Remove last strand"
            >
              {deleteStrandMutation.isPending ? '...' : '- Strand'}
            </button>
          )}
          <button
            onClick={handleAddLevel}
            className="btn btn-primary"
            disabled={addNextLevelMutation.isPending}
            title="Add level"
          >
            {addNextLevelMutation.isPending ? '...' : '+ Level'}
          </button>
          {levels.length > 0 && (
            <button
              onClick={handleRemoveLevel}
              className="btn btn-secondary"
              disabled={removeLevelMutation.isPending}
              title="Remove last level"
            >
              {removeLevelMutation.isPending ? '...' : '- Level'}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading strands...</span>
        </div>
      ) : strands.length === 0 ? (
        <div className="empty-state">
          <h3>No Strands Found</h3>
          <p>Get started by creating your first strand.</p>
          <button onClick={handleAddStrand} className="btn btn-primary" disabled={createStrandMutation.isPending}>
            {createStrandMutation.isPending ? '...' : '+ Strand'}
          </button>
        </div>
      ) : (
        <div className="academic-detail-grid">
          {strands.map((strand) => (
            <BaseCard key={strand.id} className="academic-detail-card">
              <div className="card-header">
                <div className="academic-detail-card-header">
                  <h3 className="card-title">{strand.name}</h3>
                  <span className="status-badge status-default">Strand</span>
                </div>
              </div>
              <div className="card-body">
                <div className="academic-detail-list">
                  <div className="academic-detail-row">
                    <span className="detail-label">Program</span>
                    <span className="detail-value">{program.name}</span>
                  </div>
                  <div className="academic-detail-row">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{program.type}</span>
                  </div>
                </div>

                <div className="nested-levels">
                  <div className="nested-levels-title">Levels</div>
                  {levels.length === 0 ? (
                    <p className="nested-empty">No levels added yet.</p>
                  ) : (
                    <div className="nested-level-list">
                      {levels.map((level) => (
                        <span key={level.id} className="nested-level-chip">
                          {level.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </BaseCard>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!strandToDelete}
        title="Remove Strand"
        message={`This will remove "${strandToDelete?.name ?? 'this strand'}".`}
        confirmLabel="Remove Strand"
        isLoading={deleteStrandMutation.isPending}
        onConfirm={confirmRemoveStrand}
        onClose={() => setStrandToDelete(null)}
      />

      <ConfirmationModal
        isOpen={!!levelToDelete}
        title="Remove Level"
        message={`This will remove "${levelToDelete?.name ?? 'this level'}".`}
        confirmLabel="Remove Level"
        isLoading={removeLevelMutation.isPending}
        onConfirm={confirmRemoveLevel}
        onClose={() => setLevelToDelete(null)}
      />
    </div>
  );
};

export default AcademicStrandPage;
