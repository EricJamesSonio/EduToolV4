import { useState } from 'react';
import BaseCard from '@/components/BaseCard';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button/Button';
import EnrollStudentModal from '../../components/modals/EnrollStudentModal';
import PeopleDetailModal from '../../../people/components/PeopleDetailModal';
import type { Student } from '../../../people/types/student.types';
import { getStudentName } from '../../utils/section-details.utils';
import { useUpdateStudent } from '../../../people/hooks/useStudents';

type Props = {
  students: Student[];
  isLoading: boolean;
  isError: boolean;
  sectionId: string;
};

const SectionStudentsTab: React.FC<Props> = ({
  students,
  isLoading,
  isError,
  sectionId,
}) => {
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const updateStudentMutation = useUpdateStudent();

  const handleEnrollClick = () => {
    setSelectedStudent(null);
    setIsEnrollModalOpen(true);
  };

  const handleViewClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const handleUnenrollClick = (student: Student) => {
    if (window.confirm(`Are you sure you want to unenroll ${getStudentName(student)}?`)) {
      updateStudentMutation.mutate({
        id: student.id,
        data: { sectionId: undefined },
      });
    }
  };

  const handleEnrollStudent = async (student: Student) => {
    return new Promise<void>((resolve, reject) => {
      updateStudentMutation.mutate(
        {
          id: student.id,
          data: { sectionId },
        },
        {
          onSuccess: () => {
            setIsEnrollModalOpen(false);
            resolve();
          },
          onError: (error) => {
            console.error('Failed to enroll student:', error);
            reject(error);
          },
        }
      );
    });
  };

  const enrolledStudentIds = students.map((s) => s.id);

  return (
    <>
      <BaseCard className="section-details-card" hover={false}>
        <div className="card-header">
          <h3 className="card-title">Student List</h3>
          <div className="card-header-actions">
            <span className="status-badge status-default">{students.length} found</span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEnrollClick}
              disabled={isLoading}
            >
              Enroll Student
            </Button>
          </div>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="sections-loading">
              <div className="loading-spinner loading-spinner-sm" />
              <span className="loading-text">Loading students...</span>
            </div>
          ) : isError ? (
            <EmptyState
              title="Unable to Load Students"
              description="The students for this section could not be loaded right now."
            />
          ) : students.length === 0 ? (
            <EmptyState
              title="No Students Found"
              description="Students assigned to this section will appear here."
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{getStudentName(student)}</td>
                      <td>{student.studentId ?? '-'}</td>
                      <td>{student.email}</td>
                      <td>
                        <span className={`status-badge status-${student.status}`}>
                          {student.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewClick(student)}
                          >
                            View
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUnenrollClick(student)}
                          >
                            Unenroll
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </BaseCard>

      {/* Enroll Student Modal - Select from ALL global students */}
      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        sectionId={sectionId}
        enrolledStudentIds={enrolledStudentIds}
        isLoading={updateStudentMutation.isPending}
        onEnroll={handleEnrollStudent}
        onClose={() => setIsEnrollModalOpen(false)}
      />

      {/* View Student Details Modal */}
      <PeopleDetailModal
        account={selectedStudent}
        accountType="student"
        onClose={() => {
          setSelectedStudent(null);
          setIsDetailModalOpen(false);
        }}
      />
    </>
  );
};

export default SectionStudentsTab;