interface SystemCategoryPageProps {
  onSelectOrganization: () => void;
  onSelectSeeder: () => void;
  onSelectGradingSchemes: () => void;
  onSelectGradingScales: () => void;
  onSelectSemesterTemplates: () => void;
  onSelectGradeLock: () => void;
}

const SystemCategoryPage: React.FC<SystemCategoryPageProps> = ({
  onSelectOrganization,
  onSelectSeeder,
  onSelectGradingSchemes,
  onSelectGradingScales,
  onSelectSemesterTemplates,
  onSelectGradeLock,
}) => {
  return (
    <div className="system-categories">
      <div className="dashboard-section-header">
        <div className="section-title-group">
          <h2 className="dashboard-section-title">System</h2>
        </div>
      </div>

      <div className="system-category-grid">
        <button
          type="button"
          className="card system-category-card"
          onClick={onSelectOrganization}
        >
          <span className="system-category-title">
            Organization
          </span>

          <span className="system-category-description">
            Manage school details, email extension,
            and organization information.
          </span>
        </button>

        <button
          type="button"
          className="card system-category-card"
          onClick={onSelectSeeder}
        >
          <span className="system-category-title">
            Data Seeder
          </span>

          <span className="system-category-description">
            Seed academic setup data for a selected
            school year.
          </span>
        </button>

        <button
          type="button"
          className="card system-category-card"
          onClick={onSelectGradingSchemes}
        >
          <span className="system-category-title">
            Grading Schemes
          </span>

          <span className="system-category-description">
            Create and manage reusable grading
            scheme templates scoped by program type.
          </span>
        </button>

        <button
          type="button"
          className="card system-category-card"
          onClick={onSelectGradingScales}
        >
          <span className="system-category-title">
            Grading Scales
          </span>

          <span className="system-category-description">
            Define grade ranges such as A–F or
            numeric equivalents used across
            grading schemes.
          </span>
        </button>

        <button
          type="button"
          className="card system-category-card"
          onClick={onSelectSemesterTemplates}
        >
          <span className="system-category-title">
            Semester Templates
          </span>

          <span className="system-category-description">
            Manage reusable semester structures,
            academic terms, and template defaults.
          </span>
        </button>

        <button
          type="button"
          className="card system-category-card"
          onClick={onSelectGradeLock}
        >
          <span className="system-category-title">
            Grade Lock
          </span>

          <span className="system-category-description">
            Manage grade lock settings and control
            class locking by school year.
          </span>
        </button>
      </div>
    </div>
  );
};

export default SystemCategoryPage;