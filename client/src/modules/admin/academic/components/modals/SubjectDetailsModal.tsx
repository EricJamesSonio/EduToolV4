import React from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import type { Subject } from '../../types/subject.types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
};

const SubjectDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  subject,
}) => {
  if (!subject) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Subject Details"
      size="md"
      closeOnOverlayClick={true}
    >
      <div className="subject-details-content">
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Subject Name</span>
            <span className="detail-value">{subject.title}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Subject Type</span>
            <span className="detail-value">
              <span className={`status-badge status-${subject.subjectType}`}>
                {subject.subjectType}
              </span>
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Year Level</span>
            <span className="detail-value">{subject.yearLevel ?? '—'}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Term</span>
            <span className="detail-value">{subject.termLabel ?? '—'}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Program</span>
            <span className="detail-value">{subject.programName ?? '—'}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Program Type</span>
            <span className="detail-value">{subject.programType ?? '—'}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Level</span>
            <span className="detail-value">{subject.levelName ?? '—'}</span>
          </div>

          {subject.courseId && (
            <div className="detail-item">
              <span className="detail-label">Course ID</span>
              <span className="detail-value">{subject.courseId}</span>
            </div>
          )}

          {subject.strandId && (
            <div className="detail-item">
              <span className="detail-label">Strand ID</span>
              <span className="detail-value">{subject.strandId}</span>
            </div>
          )}

          <div className="detail-item">
            <span className="detail-label">Status</span>
            <span className="detail-value">
              <span
                className={`status-badge status-${subject.lockStatus === 'locked' ? 'warning' : 'default'}`}
              >
                {subject.lockStatus}
              </span>
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Created At</span>
            <span className="detail-value">{formatDate(subject.createdAt)}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Updated At</span>
            <span className="detail-value">{formatDate(subject.updatedAt)}</span>
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SubjectDetailsModal;
