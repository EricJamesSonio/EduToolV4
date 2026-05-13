interface PeopleCategoryPageProps {
  studentCount?: number;
  educatorCount?: number;
  onSelectStudents: () => void;
  onSelectEducators: () => void;
}

const formatCount = (count: number | undefined) => {
  return typeof count === 'number' ? count.toString() : '--';
};

const PeopleCategoryPage: React.FC<PeopleCategoryPageProps> = ({
  studentCount,
  educatorCount,
  onSelectStudents,
  onSelectEducators,
}) => {
  return (
    <div className="people-categories">
      <div className="dashboard-section-header">
        <div className="section-title-group">
          <h2 className="dashboard-section-title">People Directory</h2>
          <p className="dashboard-section-subtitle">
            Choose the account group you want to manage.
          </p>
        </div>
      </div>

      <div className="people-category-grid">
        <button
          type="button"
          className="card people-category-card"
          onClick={onSelectStudents}
        >
          <span className="people-category-kicker">Learners</span>
          <span className="people-category-title">Students</span>
          <span className="people-category-description">
            Manage student accounts, statuses, school IDs, and academic placement.
          </span>
          <span className="people-category-count">
            <strong>{formatCount(studentCount)}</strong>
            <span>Total students</span>
          </span>
        </button>

        <button
          type="button"
          className="card people-category-card"
          onClick={onSelectEducators}
        >
          <span className="people-category-kicker">Faculty</span>
          <span className="people-category-title">Educators</span>
          <span className="people-category-description">
            Manage educator accounts, generated educator IDs, and profile details.
          </span>
          <span className="people-category-count">
            <strong>{formatCount(educatorCount)}</strong>
            <span>Total educators</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default PeopleCategoryPage;
