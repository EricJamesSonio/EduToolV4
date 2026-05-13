interface SystemCategoryPageProps {
  onSelectOrganization: () => void;
  onSelectSeeder: () => void;
  onSelectGradingSchemes: () => void;
  onSelectGradingScales: () => void; // ✅ added
}

const SystemCategoryPage: React.FC<SystemCategoryPageProps> = ({
  onSelectOrganization,
  onSelectSeeder,
  onSelectGradingSchemes,
  onSelectGradingScales, // ✅ added
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
          <span className="system-category-title">Organization</span>
          <span className="system-category-description">
            Manage school details, email extension, and description.
          </span>
        </button>

        <button
          type="button"
          className="card system-category-card"
          onClick={onSelectSeeder}
        >
          <span className="system-category-title">Data Seeder</span>
          <span className="system-category-description">
            Seed academic setup data for a selected school year.
          </span>
        </button>

        <button
          type="button"
          className="card system-category-card"
          onClick={onSelectGradingSchemes}
        >
          <span className="system-category-title">Grading Schemes</span>
          <span className="system-category-description">
            Create and manage reusable grading scheme templates scoped by program type.
          </span>
        </button>

        {/* ✅ NEW CARD */}
        <button
          type="button"
          className="card system-category-card"
          onClick={onSelectGradingScales}
        >
          <span className="system-category-title">Grading Scales</span>
          <span className="system-category-description">
            Define grade ranges (e.g., A–F or numeric equivalents) used across grading schemes.
          </span>
        </button>
      </div>
    </div>
  );
};

export default SystemCategoryPage;