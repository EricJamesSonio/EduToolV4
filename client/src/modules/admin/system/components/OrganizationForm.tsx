import { useEffect, useState } from 'react';
import type {
  CreateOrganizationDto,
  Organization,
  UpdateOrganizationDto,
} from '../types/organization.types';

interface OrganizationFormProps {
  organization?: Organization | null;
  isLoading: boolean;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (data: CreateOrganizationDto | UpdateOrganizationDto) => void;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  organization,
  isLoading,
  submitLabel,
  onCancel,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emailExtension, setEmailExtension] = useState('');

  useEffect(() => {
    setName(organization?.name ?? '');
    setDescription(organization?.description ?? '');
    setEmailExtension(organization?.emailExtension ?? '');
  }, [organization]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      emailExtension: emailExtension.trim() || undefined,
    });
  };

  return (
    <form className="form organization-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="organization-name">
          School Name <span className="required">*</span>
        </label>
        <input
          id="organization-name"
          className="form-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={2}
          maxLength={100}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="organization-email-extension">
          Email Extension
        </label>
        <input
          id="organization-email-extension"
          className="form-input"
          value={emailExtension}
          onChange={(event) => setEmailExtension(event.target.value)}
          placeholder="@school.edu"
        />
        <span className="form-hint">Use a domain format like @school.edu.</span>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="organization-description">
          Description
        </label>
        <textarea
          id="organization-description"
          className="form-textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
        />
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default OrganizationForm;
