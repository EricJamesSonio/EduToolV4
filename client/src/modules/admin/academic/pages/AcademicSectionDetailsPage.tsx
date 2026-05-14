import { useMemo, useState } from 'react';
import BaseCard from '@/components/BaseCard';
import { useStudents } from '../../people/hooks/useStudents';
import { useClassesBySection } from '../hooks/useClasses';
import type { Section } from '../api/section.api';
import SectionStudentsTab from './section_detail/SectionStudentsTab';
import SectionClassesTab from './section_detail/SectionClassesTab';
import SectionScheduleTab from './section_detail/SectionScheduleTab';

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
          <SectionStudentsTab
            students={students}
            isLoading={studentsLoading}
            isError={studentsError}
            sectionId={section.id}
            levelId={levelId}
            courseId={context.courseId}
            strandId={context.strandId}
          />
        )}
        {tab === 'classes' && (
          <SectionClassesTab
            classes={classes}
            isLoading={classesLoading}
            isError={classesError}
            schoolYearId={schoolYearId}
            sectionId={section.id}
            levelId={levelId}
          />
        )}
        {tab === 'schedule' && (
          <SectionScheduleTab
            classes={classes}
            isLoading={classesLoading}
            isError={classesError}
          />
        )}
      </div>
    </div>
  );
};

export default AcademicSectionDetailsPage;