import { useEffect, useState } from 'react';

import AdminLayout from '../../../components/AdminLayout';

import AdminDataSeederPage from './pages/AdminDataSeederPage';
import AdminOrganizationPage from './pages/AdminOrganizationPage';
import CreateOrganizationModal from './components/organization/CreateOrganizationModal';

import SystemCategoryPage from './pages/SystemCategoryPage';

import GradingSchemeTemplatePage from './pages/GradingSchemeTemplatePage';
import GradingScalePage from './pages/GradingScalePage';
import SemesterTemplatePage from './pages/SemesterTemplatePage';

import { refreshTokenApi } from '@/modules/home/login/api/auth.api';
import { useAuthContext } from '@/context/AuthContext';

import {
  useCreateOrganization,
  useOrganization,
  useSeedOrganization,
  useUpdateOrganization,
} from './hooks/useOrganization';

import type {
  CreateOrganizationDto,
  SeedOrganizationResponse,
  UpdateOrganizationDto,
} from './types/organization.types';

type SystemView =
  | 'categories'
  | 'organization'
  | 'seeder'
  | 'grading-schemes'
  | 'grading-scales'
  | 'semester-templates';

export const AdminSystem: React.FC = () => {
  const [view, setView] = useState<SystemView>('categories');

  const [showCreateOrganizationModal, setShowCreateOrganizationModal] =
    useState(false);

  const [seedResult, setSeedResult] =
    useState<SeedOrganizationResponse | null>(null);

  const { refreshUser } = useAuthContext();

  const organizationQuery = useOrganization();

  const createOrganizationMutation = useCreateOrganization();
  const updateOrganizationMutation = useUpdateOrganization();
  const seedOrganizationMutation = useSeedOrganization();

  useEffect(() => {
    if (
      !organizationQuery.isLoading &&
      organizationQuery.data === null
    ) {
      setShowCreateOrganizationModal(true);
    }
  }, [organizationQuery.data, organizationQuery.isLoading]);

  const handleCreateOrganization = async (
    data: CreateOrganizationDto,
  ) => {
    await createOrganizationMutation.mutateAsync(data);

    const refreshedTokens = await refreshTokenApi();

    localStorage.setItem(
      'accessToken',
      refreshedTokens.accessToken,
    );

    await refreshUser();

    setShowCreateOrganizationModal(false);
  };

  const handleUpdateOrganization = async (
    data: UpdateOrganizationDto,
  ) => {
    await updateOrganizationMutation.mutateAsync(data);
  };

  const renderContent = () => {
    if (organizationQuery.isLoading) {
      return (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>

          <span className="loading-text">
            Loading system settings...
          </span>
        </div>
      );
    }

    switch (view) {
      case 'organization':
        return (
          <AdminOrganizationPage
            organization={organizationQuery.data ?? null}
            isSaving={updateOrganizationMutation.isPending}
            onBack={() => setView('categories')}
            onSubmit={handleUpdateOrganization}
          />
        );

      case 'seeder':
        return (
          <AdminDataSeederPage
            isSeeding={seedOrganizationMutation.isPending}
            seedResult={seedResult}
            onBack={() => setView('categories')}
            onSeed={async (data) => {
              const result =
                await seedOrganizationMutation.mutateAsync(data);

              setSeedResult(result);
            }}
          />
        );

      case 'grading-schemes':
        return (
          <GradingSchemeTemplatePage
            onBack={() => setView('categories')}
          />
        );

      case 'grading-scales':
        return (
          <GradingScalePage
            onBack={() => setView('categories')}
          />
        );

      case 'semester-templates':
        return (
          <SemesterTemplatePage
            onBack={() => setView('categories')}
          />
        );

      default:
        return (
          <SystemCategoryPage
            onSelectOrganization={() =>
              setView('organization')
            }
            onSelectSeeder={() =>
              setView('seeder')
            }
            onSelectGradingSchemes={() =>
              setView('grading-schemes')
            }
            onSelectGradingScales={() =>
              setView('grading-scales')
            }
            onSelectSemesterTemplates={() =>
              setView('semester-templates')
            }
          />
        );
    }
  };

  return (
    <AdminLayout>
      <div className="admin-system">
        <div className="admin-system-content">
          {renderContent()}
        </div>
      </div>

      <CreateOrganizationModal
        isOpen={showCreateOrganizationModal}
        isLoading={createOrganizationMutation.isPending}
        onSubmit={handleCreateOrganization}
      />
    </AdminLayout>
  );
};