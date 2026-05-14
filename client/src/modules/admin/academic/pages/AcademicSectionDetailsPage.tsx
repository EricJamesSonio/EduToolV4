import { useMemo, useState } from 'react';
import BaseCard from '@/components/BaseCard';
import EmptyState from '@/components/EmptyState';
import { useStudents } from '../../people/hooks/useStudents';
import type { Student } from '../../people/types/student.types';
import { useClassesBySection } from '../hooks/useClasses';
import type { AcademicClass, ClassSchedule } from '../api/class.api';
import type { Section } from '../api/section.api';

type Props = {
  schoolYearId: string;
  section: Section;
  levelId: string;
  context: { courseId?: string; strandId?: string };
  onBack: () => void;
};

type TabKey = 'students' | 'classes' | 'schedule';

const tabOptions: Array<{ key: TabKey; label: string }> = [
  { key: 'students', label: 'Student List' },
  { key: 'classes', label: 'Class List' },
  { key: 'schedule', label: 'Weekly Schedule' },
];

const weekdayLabels: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getStudentName = (student: Student) => student.fullName ?? 'Unnamed student';

const getClassTitle = (academicClass: AcademicClass) =>
  academicClass.subject_name ?? academicClass.subject_id;

const getScheduleItems = (classes: AcademicClass[]) => {
  return classes.flatMap((academicClass) =>
    academicClass.schedules.map((schedule) => ({
      classId: academicClass.id,
      subjectName: getClassTitle(academicClass),
      capacity: academicClass.capacity,
      schedule,
    })),
  );
};

const AcademicSectionDetailsPage: React.FC<Props> = ({
  schoolYearId,
  section,
  levelId,
  context,
  onBack,
}) => {
  const [tab, setTab] = useState<TabKey>('students');

  const studentFilters = useMemo(
    () => ({
      schoolYearId,
      levelId,
      sectionId: section.id,
      courseId: context.courseId,
      strandId: context.strandId,
    }),
    [context.courseId, context.strandId, levelId, schoolYearId, section.id],
  );

  const {
    data: students = [],
    isLoading: studentsLoading,
    isError: studentsError,
  } = useStudents(studentFilters);

  const {
    data: classes = [],
    isLoading: classesLoading,
    isError: classesError,
  } = useClassesBySection(schoolYearId, section.id);

  const scheduleItems = useMemo(() => getScheduleItems(classes), [classes]);

  const scheduleByWeekday = useMemo(() => {
    const grouped = new Map<number, Array<{
      classId: string;
      subjectName: string;
      capacity: number;
      schedule: ClassSchedule;
    }>>();

    scheduleItems.forEach((item) => {
      grouped.set(item.schedule.weekday, [
        ...(grouped.get(item.schedule.weekday) ?? []),
        item,
      ]);
    });

    grouped.forEach((items) => {
      items.sort((a, b) => a.schedule.start_time.localeCompare(b.schedule.start_time));
    });

    return grouped;
  }, [scheduleItems]);

  const subtitle = `${section.name} - ${section.studentCount}/${section.capacity} students`;

  return (
    <div className="view-container section-details-page">
      <div className="view-header">
        <button type="button" onClick={onBack} className="back-button">
          Back to Levels
        </button>
        <div className="header-title">
          <h2 className="dashboard-section-title">Section Details</h2>
          <p className="dashboard-section-subtitle">{subtitle}</p>
        </div>
      </div>

      <BaseCard className="section-detail-choice-card" hover={false}>
        <div className="section-detail-choice-list">
          {tabOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={tab === option.key ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setTab(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </BaseCard>

      <div className="section-details-body">
        {tab === 'students' && (
          <BaseCard className="section-details-card" hover={false}>
            <div className="card-header">
              <h3 className="card-title">Student List</h3>
              <span className="status-badge status-default">{students.length} found</span>
            </div>
            <div className="card-body">
              {studentsLoading ? (
                <div className="sections-loading">
                  <div className="loading-spinner loading-spinner-sm" />
                  <span className="loading-text">Loading students...</span>
                </div>
              ) : studentsError ? (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </BaseCard>
        )}

        {tab === 'classes' && (
          <BaseCard className="section-details-card" hover={false}>
            <div className="card-header">
              <h3 className="card-title">Class List</h3>
              <span className="status-badge status-default">{classes.length} found</span>
            </div>
            <div className="card-body">
              {classesLoading ? (
                <div className="sections-loading">
                  <div className="loading-spinner loading-spinner-sm" />
                  <span className="loading-text">Loading classes...</span>
                </div>
              ) : classesError ? (
                <EmptyState
                  title="Unable to Load Classes"
                  description="The classes for this section could not be loaded right now."
                />
              ) : classes.length === 0 ? (
                <EmptyState
                  title="No Classes Found"
                  description="Classes assigned to this section will appear here."
                />
              ) : (
                <div className="section-class-list">
                  {classes.map((academicClass) => (
                    <div key={academicClass.id} className="section-class-item">
                      <div>
                        <h4 className="section-class-title">{getClassTitle(academicClass)}</h4>
                        <p className="section-class-meta">
                          Capacity: {academicClass.capacity}
                        </p>
                      </div>
                      <span className="status-badge status-default">
                        {academicClass.schedules.length} schedule
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BaseCard>
        )}

        {tab === 'schedule' && (
          <BaseCard className="section-details-card" hover={false}>
            <div className="card-header">
              <h3 className="card-title">Weekly Schedule</h3>
              <span className="status-badge status-default">
                {scheduleItems.length} slot
              </span>
            </div>
            <div className="card-body">
              {classesLoading ? (
                <div className="sections-loading">
                  <div className="loading-spinner loading-spinner-sm" />
                  <span className="loading-text">Loading schedule...</span>
                </div>
              ) : classesError ? (
                <EmptyState
                  title="Unable to Load Schedule"
                  description="The schedule for this section could not be loaded right now."
                />
              ) : scheduleItems.length === 0 ? (
                <EmptyState
                  title="No Schedule Found"
                  description="Class schedules assigned to this section will appear here."
                />
              ) : (
                <div className="weekly-schedule-grid">
                  {weekdayLabels.map((weekday) => {
                    const items = scheduleByWeekday.get(weekday.value) ?? [];

                    return (
                      <div key={weekday.value} className="weekly-schedule-day">
                        <h4 className="weekly-schedule-day-title">{weekday.label}</h4>
                        {items.length === 0 ? (
                          <p className="weekly-schedule-empty">No classes</p>
                        ) : (
                          <div className="weekly-schedule-slots">
                            {items.map((item) => (
                              <div
                                key={`${item.classId}-${item.schedule.weekday}-${item.schedule.start_time}`}
                                className="weekly-schedule-slot"
                              >
                                <span className="weekly-schedule-subject">
                                  {item.subjectName}
                                </span>
                                <span className="weekly-schedule-time">
                                  {formatTime(item.schedule.start_time)} - {formatTime(item.schedule.end_time)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </BaseCard>
        )}
      </div>
    </div>
  );
};

export default AcademicSectionDetailsPage;
