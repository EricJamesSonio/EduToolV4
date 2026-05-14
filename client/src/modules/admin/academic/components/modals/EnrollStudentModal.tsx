import { useEffect, useState, useMemo } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button/Button';
import { useStudents } from '../../../people/hooks/useStudents';
import { getStudentName } from '../../utils/section-details.utils';
import type { Student } from '../../../people/types/student.types';

interface EnrollStudentModalProps {
  isOpen: boolean;
  sectionId: string;
  enrolledStudentIds: string[];
  isLoading?: boolean;
  onEnroll: (student: Student) => Promise<void>;
  onClose: () => void;
}

const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  isOpen,
  sectionId,
  enrolledStudentIds,
  isLoading = false,
  onEnroll,
  onClose,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  const { data: availableStudents = [], isLoading: isLoadingStudents } =
    useStudents();

  const filteredStudents = useMemo(() => {
    return availableStudents
      .filter((student) => !enrolledStudentIds.includes(student.id))
      .filter(
        (student) =>
          searchQuery === '' ||
          getStudentName(student)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          student.studentId
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          student.email
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
  }, [availableStudents, enrolledStudentIds, searchQuery]);

  const selectedStudent = availableStudents.find(
    (s) => s.id === selectedStudentId
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedStudentId('');
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleEnroll = async () => {
    if (!selectedStudent) return;

    try {
      setIsEnrolling(true);

      await onEnroll(selectedStudent);

      setSelectedStudentId('');
      setSearchQuery('');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll Student"
      size="md"
      closeOnOverlayClick={!isEnrolling && !isLoading}
    >
      <div className="enroll-student-modal">
        <div className="form people-form enroll-student-modal-content">

          <div className="form-group">
            <label className="form-label" htmlFor="search-student">
              Search Student
            </label>

            <input
              id="search-student"
              type="text"
              className="form-input"
              placeholder="Search by name, student ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isEnrolling || isLoading}
            />

            <small className="form-help-text">
              {filteredStudents.length} student
              {filteredStudents.length !== 1 ? 's' : ''} available
            </small>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="student-select">
              Select Student
            </label>

            <div className="student-select-wrapper">
              {isLoadingStudents ? (
                <div className="loading-placeholder">
                  <div className="loading-spinner loading-spinner-sm" />
                  <span>Loading students...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="empty-placeholder">
                  {availableStudents.length > 0 &&
                  enrolledStudentIds.length > 0 ? (
                    <p>
                      All students are already enrolled in this section.
                    </p>
                  ) : availableStudents.length === 0 ? (
                    <p>No students available in the system.</p>
                  ) : (
                    <p>No students match your search.</p>
                  )}
                </div>
              ) : (
                <select
                  id="student-select"
                  className="form-input"
                  value={selectedStudentId}
                  onChange={(e) =>
                    setSelectedStudentId(e.target.value)
                  }
                  disabled={isEnrolling || isLoading}
                >
                  <option value="">
                    -- Select a student --
                  </option>

                  {filteredStudents.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {getStudentName(student)} (
                      {student.studentId || 'N/A'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {selectedStudent && (
            <div className="form-group student-preview">
              <label className="form-label">
                Selected Student Details
              </label>

              <div className="people-detail-grid">
                <div className="people-detail-item">
                  <span className="people-detail-label">
                    Name
                  </span>

                  <span className="people-detail-value">
                    {getStudentName(selectedStudent)}
                  </span>
                </div>

                <div className="people-detail-item">
                  <span className="people-detail-label">
                    Student ID
                  </span>

                  <span className="people-detail-value">
                    {selectedStudent.studentId || '-'}
                  </span>
                </div>

                <div className="people-detail-item">
                  <span className="people-detail-label">
                    Email
                  </span>

                  <span className="people-detail-value">
                    {selectedStudent.email}
                  </span>
                </div>

                <div className="people-detail-item">
                  <span className="people-detail-label">
                    Status
                  </span>

                  <span
                    className={`status-badge status-${selectedStudent.status}`}
                  >
                    {selectedStudent.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isEnrolling || isLoading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleEnroll}
            disabled={
              !selectedStudentId ||
              isEnrolling ||
              isLoading
            }
            loading={isEnrolling}
          >
            Enroll Student
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EnrollStudentModal;