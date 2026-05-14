import { useMemo, useState } from 'react';
import type { Section } from '../api/section.api';

// NOTE: This is a UI scaffold. Backend hooks/APIs for:
// - section students list
// - section classes list
// - class schedule slots
// are not present yet in this repo.
// It will compile and render placeholder content so the product flow can be wired.

type Props = {
  schoolYearId: string;
  section: Section;
  levelId: string;
  context: { courseId?: string; strandId?: string };
  onBack: () => void;
};

type TabKey = 'students' | 'classes' | 'schedule';

const AcademicSectionDetailsPage: React.FC<Props> = ({
  schoolYearId,
  section,
  levelId,
  onBack,
}) => {
  const [tab, setTab] = useState<TabKey>('students');

  const subtitle = useMemo(() => {
    return `${section.name} • ${section.studentCount}/${section.capacity}`;
  }, [section.capacity, section.name, section.studentCount]);

  return (
    <div className="view-container">
      <div className="view-header">
        <button onClick={onBack} className="back-button">
          Back
        </button>
        <div className="header-title">
          <h2 className="dashboard-section-title">Section Details</h2>
          <p className="dashboard-section-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="section-details-tabs">
        <button
          type="button"
          className={tab === 'students' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setTab('students')}
        >
          Students
        </button>
        <button
          type="button"
          className={tab === 'classes' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setTab('classes')}
        >
          Classes
        </button>
        <button
          type="button"
          className={tab === 'schedule' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setTab('schedule')}
        >
          Schedule
        </button>
      </div>

      <div className="section-details-body">
        {tab === 'students' ? (
          <div className="panel">
            <h3 className="panel-title">Enrolled Students</h3>
            <p className="panel-subtitle">
              TODO: Fetch enrolled students for section id <b>{section.id}</b> in school year <b>{schoolYearId}</b>.
            </p>
            <div className="panel-placeholder">
              <p>No students enrolled in this section yet.</p>
              <p className="panel-subtitle">Student data will appear here once the backend API is implemented.</p>
            </div>
          </div>
        ) : tab === 'classes' ? (
          <div className="panel">
            <h3 className="panel-title">Classes</h3>
            <p className="panel-subtitle">
              TODO: Fetch classes for section id <b>{section.id}</b>.
            </p>
            <div className="panel-placeholder">
              <p>No classes assigned to this section yet.</p>
              <p className="panel-subtitle">Class data will appear here once the backend API is implemented.</p>
            </div>
          </div>
        ) : (
          <div className="panel">
            <h3 className="panel-title">Schedule</h3>
            <p className="panel-subtitle">
              Week view schedule derived from class schedules for section <b>{section.name}</b>.
            </p>
            <div className="panel-section-placeholder">
              <div className="schedule-helper">
                <h4 className="schedule-title">Schedule (Mon-Sun)</h4>
                <div className="schedule-grid-placeholder">
                  <p>Week view will be generated from class schedules.</p>
                  <p className="panel-subtitle">Schedule data will appear here once the backend API is implemented.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keep form states minimal for now. */}
      <div style={{ display: 'none' }}>{levelId}</div>
    </div>
  );
};

export default AcademicSectionDetailsPage;

