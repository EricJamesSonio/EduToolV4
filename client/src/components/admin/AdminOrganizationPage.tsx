import OrganizationForm from './OrganizationForm';
import type {
  Organization,
  UpdateOrganizationDto,
} from '../../types/organization.types';

interface AdminOrganizationPageProps {
  organization: Organization | null;
  isSaving: boolean;
  onBack: () => void;
  onSubmit: (data: UpdateOrganizationDto) => void;
}

const AdminOrganizationPage: React.FC<AdminOrganizationPageProps> = ({
  organization,
  isSaving,
  onBack,
  onSubmit,
}) => {
  return (
    <div className="system-detail-page">
      <div className="view-container">
        <div className="view-header">
          <button type="button" onClick={onBack} className="back-button">
            Back to System
          </button>

          <div className="header-title">
            <h2 className="dashboard-section-title">Organization</h2>
            <p className="dashboard-section-subtitle">
              Manage school information used across the admin portal.
            </p>
          </div>
        </div>
      </div>

      <div className="system-form-card card">
        <OrganizationForm
          organization={organization}
          isLoading={isSaving}
          submitLabel="Save Organization"
          onSubmit={(data) => onSubmit(data as UpdateOrganizationDto)}
        />
      </div>
    </div>
  );
};

export default AdminOrganizationPage;
