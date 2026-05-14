import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import AccountCredentialModal from '../components/AccountCredentialModal';
import EducatorFormModal from '../components/EducatorFormModal';
import PeopleDetailModal from '../components/PeopleDetailModal';
import StatusModal from '../components/StatusModal';
import {
  useCreateEducator,
  useEducators,
  useResetEducatorPassword,
  useUpdateEducator,
  useUpdateEducatorStatus,
} from '../hooks/useEducators';
import type {
  CreateEducatorDto,
  Educator,
  EducatorStatus,
  EducatorWithPassword,
  UpdateEducatorDto,
} from '../types/educator.types';

interface AdminEducatorPageProps {
  onBack: () => void;
}

const educatorStatuses: Array<{ value: EducatorStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const educatorStatusOptions: Array<{ value: EducatorStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const AdminEducatorPage: React.FC<AdminEducatorPageProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EducatorStatus | ''>('');
  const [detailEducator, setDetailEducator] = useState<Educator | null>(null);
  const [formEducator, setFormEducator] = useState<Educator | null | undefined>(undefined);
  const [statusEducator, setStatusEducator] = useState<Educator | null>(null);
  const [credential, setCredential] = useState<EducatorWithPassword | null>(null);
  const queryParams = useMemo(
    () => ({ search, status: status || undefined }),
    [search, status]
  );
  const { data: educators = [], isLoading, isError } = useEducators(queryParams);
  const createEducator = useCreateEducator();
  const updateEducator = useUpdateEducator();
  const updateStatus = useUpdateEducatorStatus();
  const resetPassword = useResetEducatorPassword();

  const handleSaveEducator = async (data: CreateEducatorDto | UpdateEducatorDto) => {
    if (formEducator) {
      await updateEducator.mutateAsync({
        id: formEducator.id,
        data: data as UpdateEducatorDto,
      });
      toast.success('Educator updated.');
    } else {
      const created = await createEducator.mutateAsync(data as CreateEducatorDto);
      setCredential(created);
      toast.success('Educator created.');
    }
    setFormEducator(undefined);
  };

  const handleStatusSubmit = async (nextStatus: EducatorStatus) => {
    if (!statusEducator) return;
    await updateStatus.mutateAsync({
      id: statusEducator.id,
      data: { status: nextStatus },
    });
    toast.success('Educator status updated.');
    setStatusEducator(null);
  };

  const handleToggleBlock = async (educator: Educator) => {
    const nextStatus: EducatorStatus = educator.status === 'suspended' ? 'active' : 'suspended';
    await updateStatus.mutateAsync({
      id: educator.id,
      data: { status: nextStatus },
    });
    toast.success(nextStatus === 'suspended' ? 'Educator blocked.' : 'Educator unblocked.');
  };

  const handleResetPassword = async (educator: Educator) => {
    const result = await resetPassword.mutateAsync(educator.id);
    setCredential({ ...educator, plainPassword: result.plainPassword });
    toast.success('Educator password reset.');
  };

  const isSaving = createEducator.isPending || updateEducator.isPending;

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

          <button
            type="button"
            className="btn btn-primary people-header-action"
            onClick={() => setFormEducator(null)}
          >
            Create Educator
          </button>
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

        <select
          className="form-select people-filter"
          value={status}
          onChange={(event) => setStatus(event.target.value as EducatorStatus | '')}
          aria-label="Filter educators by status"
        >
          {educatorStatuses.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
                    <th>Actions</th>
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
                      <td className="action-cell">
                        <div className="action-buttons action-buttons-compact people-row-actions">
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => setDetailEducator(educator)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="action-button action-button-edit"
                            onClick={() => setFormEducator(educator)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="action-button action-button-edit"
                            onClick={() => setStatusEducator(educator)}
                          >
                            Status
                          </button>
                          <button
                            type="button"
                            className={
                              educator.status === 'suspended'
                                ? 'action-button action-button-edit'
                                : 'action-button action-button-delete'
                            }
                            onClick={() => handleToggleBlock(educator)}
                            disabled={updateStatus.isPending}
                          >
                            {educator.status === 'suspended' ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => handleResetPassword(educator)}
                            disabled={resetPassword.isPending}
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <PeopleDetailModal
        account={detailEducator}
        accountType="educator"
        onClose={() => setDetailEducator(null)}
      />
      <EducatorFormModal
        isOpen={formEducator !== undefined}
        educator={formEducator}
        isLoading={isSaving}
        onSubmit={handleSaveEducator}
        onClose={() => setFormEducator(undefined)}
      />
      <StatusModal
        isOpen={!!statusEducator}
        title="Manage Educator Status"
        currentStatus={statusEducator?.status}
        options={educatorStatusOptions}
        isLoading={updateStatus.isPending}
        onSubmit={(nextStatus) => handleStatusSubmit(nextStatus as EducatorStatus)}
        onClose={() => setStatusEducator(null)}
      />
      <AccountCredentialModal
        isOpen={!!credential}
        title="Educator Credentials"
        email={credential?.email}
        plainPassword={credential?.plainPassword}
        onClose={() => setCredential(null)}
      />
    </div>
  );
};

export default AdminEducatorPage;
