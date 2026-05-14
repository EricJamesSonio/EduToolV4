import React from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button/Button";
import type { Subject } from "../../types/subject.types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
};

const SubjectDetailsModal: React.FC<Props> = ({ isOpen, onClose, subject }) => {
  if (!subject) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
        <div className="subject-overview card card-flat">
          <div className="card-header">
            <h3 className="card-title">{subject.title}</h3>
            <div className="card-actions">
              <span className={`status-badge status-${subject.subjectType}`}>
                {subject.subjectType}
              </span>

              <span
                className={`status-badge status-${
                  subject.lockStatus === "locked" ? "warning" : "success"
                }`}
              >
                {subject.lockStatus}
              </span>
            </div>
          </div>

          <div className="card-body">
            <p className="card-text">
              Subject information and academic metadata
            </p>
          </div>
        </div>

        <div className="details-grid">
          <div className="card detail-card">
            <span className="detail-label">Year Level</span>
            <span className="detail-value">{subject.yearLevel ?? "—"}</span>
          </div>

          <div className="card detail-card">
            <span className="detail-label">Term</span>
            <span className="detail-value">{subject.termLabel ?? "—"}</span>
          </div>

          <div className="card detail-card">
            <span className="detail-label">Program</span>
            <span className="detail-value">{subject.programName ?? "—"}</span>
          </div>

          <div className="card detail-card">
            <span className="detail-label">Program Type</span>
            <span className="detail-value">{subject.programType ?? "—"}</span>
          </div>

          <div className="card detail-card">
            <span className="detail-label">Level</span>
            <span className="detail-value">{subject.levelName ?? "—"}</span>
          </div>

          {subject.courseId && (
            <div className="card detail-card">
              <span className="detail-label">Course ID</span>
              <span className="detail-value">{subject.courseId}</span>
            </div>
          )}

          {subject.strandId && (
            <div className="card detail-card">
              <span className="detail-label">Strand ID</span>
              <span className="detail-value">{subject.strandId}</span>
            </div>
          )}
        </div>

        <div className="meta-section card card-flat">
          <div className="meta-row">
            <span>Created</span>
            <strong>{formatDate(subject.createdAt)}</strong>
          </div>

          <div className="meta-row">
            <span>Updated</span>
            <strong>{formatDate(subject.updatedAt)}</strong>
          </div>
        </div>

        <div className="form-actions">
          <Button type="button" variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SubjectDetailsModal;
