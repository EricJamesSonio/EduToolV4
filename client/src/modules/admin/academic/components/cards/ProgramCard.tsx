// Program Card Component
// Individual program card with stats display

import React from 'react';
import type { ProgramWithStats } from '../../modules/admin/academic/types/program.types';
import ActionButtons from '../ActionButtons';
import BaseCard from '../BaseCard';
import { getProgramTypeLabel } from '../../constants/programTypes';

interface ProgramCardProps {
  program: ProgramWithStats;
  onEdit: (program: ProgramWithStats) => void;
  onDelete: (program: ProgramWithStats) => void;
  onView: (program: ProgramWithStats) => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, onEdit, onDelete, onView }) => {
  const getProgramStats = (program: ProgramWithStats) => {
    const levelsCount = program.levels?.length || 0;
    const coursesCount = program.courses?.length || 0;
    const strandsCount = program.strands?.length || 0;

    return {
      levelsCount,
      coursesCount,
      strandsCount,
      hasLevels: levelsCount > 0,
      hasCourses: coursesCount > 0,
      hasStrands: strandsCount > 0,
    };
  };

  return (
    <BaseCard className="program-card">
      <div className="card-header">
        <div className="program-header-content">
          <h3 className="card-title">{program.name}</h3>
        </div>
      </div>
      <div className="card-body">
        <div className="program-type-badge">
          <span className="status-badge status-default">
            {getProgramTypeLabel(program.type)}
          </span>
        </div>
        <div className="program-stats">
          {getProgramStats(program).hasLevels && (
            <div className="stat-item">
              <span className="stat-label">Levels:</span>
              <span className="stat-value">{getProgramStats(program).levelsCount}</span>
            </div>
          )}
          {getProgramStats(program).hasCourses && (
            <div className="stat-item">
              <span className="stat-label">Courses:</span>
              <span className="stat-value">{getProgramStats(program).coursesCount}</span>
            </div>
          )}
          {getProgramStats(program).hasStrands && (
            <div className="stat-item">
              <span className="stat-label">Strands:</span>
              <span className="stat-value">{getProgramStats(program).strandsCount}</span>
            </div>
          )}
        </div>
      </div>
      <div className="card-footer">
        <div className="footer-actions">
          <button
            onClick={() => onView(program)}
            className="btn btn-secondary btn-sm"
          >
            View
          </button>
          <ActionButtons
            onEdit={() => onEdit(program)}
            onDelete={() => onDelete(program)}
            size="sm"
            variant="compact"
          />
        </div>
      </div>
    </BaseCard>
  );
};

export default ProgramCard;
