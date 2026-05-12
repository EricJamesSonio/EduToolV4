// AcademicContext Component
// Displays current academic year, semester, and grading information

import React from 'react';
import { cn } from '../../utils/helpers';
import type { AcademicContext as AcademicContextType } from '../../api/dashboard.api';

export interface AcademicContextProps {
  academicContext: AcademicContextType;
  className?: string;
}

const AcademicContext: React.FC<AcademicContextProps> = ({
  academicContext,
  className
}) => {
  const baseClasses = 'academic-context';
  const classes = cn(baseClasses, className);

  const getGradeLockStatus = (status: AcademicContextType['gradeLockStatus']) => {
    return status === 'enabled' ? '🔒 Locked' : '🔓 Unlocked';
  };

  const getGradeLockClass = (status: AcademicContextType['gradeLockStatus']) => {
    return status === 'enabled' ? 'status-locked' : 'status-unlocked';
  };

  return (
    <div className={classes}>
      <div className="academic-context-header">
        <h3 className="academic-context-title">Academic Context</h3>
      </div>
      <div className="academic-context-content">
        <div className="academic-context-item">
          <div className="academic-context-label">School Year</div>
          <div className="academic-context-value">{academicContext.schoolYear}</div>
        </div>
        <div className="academic-context-item">
          <div className="academic-context-label">Semester</div>
          <div className="academic-context-value">{academicContext.semester}</div>
        </div>
        <div className="academic-context-item">
          <div className="academic-context-label">Grading Period</div>
          <div className="academic-context-value">{academicContext.gradingPeriod}</div>
        </div>
        <div className="academic-context-item">
          <div className="academic-context-label">Grade Lock Status</div>
          <div className={cn('academic-context-value', getGradeLockClass(academicContext.gradeLockStatus))}>
            {getGradeLockStatus(academicContext.gradeLockStatus)}
          </div>
        </div>
        {academicContext.gradeLockDate && (
          <div className="academic-context-item">
            <div className="academic-context-label">Lock Date</div>
            <div className="academic-context-value">{academicContext.gradeLockDate}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicContext;
