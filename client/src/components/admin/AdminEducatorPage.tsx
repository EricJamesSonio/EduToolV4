import { useMemo, useState } from 'react';
import { useEducators } from '../../hooks/useEducators';

interface AdminEducatorPageProps {
  onBack: () => void;
}

const AdminEducatorPage: React.FC<AdminEducatorPageProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');
  const queryParams = useMemo(() => ({ search }), [search]);
  const { data: educators = [], isLoading, isError } = useEducators(queryParams);

  return (
    <div className="people-list-page">
      <div className="view-container">
        <div className="view-header">
          <button type="button" onClick={onBack} className="back-button">
            Back to People
          </button>

          <div className="header-title">
            <h2 className="dashboard-section-title">Educators</h2>
            <p className="dashboard-section-subtitle">
              Manage faculty accounts and educator profile details.
            </p>
          </div>
        </div>
      </div>

      <div className="people-toolbar">
        <div className="search-form people-search">
          <input
            type="search"
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search educators"
            aria-label="Search educators"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="people-loading">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading educators...</span>
        </div>
      ) : isError ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <h3 className="empty-state-title">Unable to Load Educators</h3>
            <p className="empty-state-text">
              The educators list could not be loaded right now.
            </p>
          </div>
        </div>
      ) : educators.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <h3 className="empty-state-title">No Educators Found</h3>
            <p className="empty-state-text">
              Educators matching the current search will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-card people-table-card">
          <div className="card-header">
            <h3 className="card-title">Educator Accounts</h3>
            <span className="people-result-count">{educators.length} found</span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Educator ID</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Personal Email</th>
                  </tr>
                </thead>
                <tbody>
                  {educators.map((educator) => (
                    <tr key={educator.id}>
                      <td>{educator.fullName ?? 'Unnamed educator'}</td>
                      <td>{educator.educatorId ?? '-'}</td>
                      <td>{educator.email}</td>
                      <td>
                        <span className={`status-badge status-${educator.status}`}>
                          {educator.status}
                        </span>
                      </td>
                      <td>{educator.personalEmail ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEducatorPage;
