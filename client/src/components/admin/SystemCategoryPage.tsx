interface SystemCategoryPageProps {
  onSelectOrganization: () => void;
  onSelectSeeder: () => void;
}

const SystemCategoryPage: React.FC<SystemCategoryPageProps> = ({
  onSelectOrganization,
  onSelectSeeder,
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
      </div>
    </div>
  );
};

export default SystemCategoryPage;
