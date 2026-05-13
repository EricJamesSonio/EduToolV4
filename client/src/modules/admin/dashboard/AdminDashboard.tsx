// Admin Dashboard Page
// Main admin dashboard with statistics, academic context, and alerts

import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import StatCard from '@/components/StatCard/StatCard';
import AlertCard from '@/components/AlertCard/AlertCard';
import AcademicContext from './context/AcademicContext';
import { useDashboardData } from './hooks/useDashboardData';
import { InlineError } from '@/components/ErrorDisplay/ErrorDisplay';

export const AdminDashboard: React.FC = () => {
  const { stats, academicContext, alerts, isLoading, isError, refetch } = useDashboardData();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="dashboard">
          <div className="dashboard-loading">
            <div>Loading dashboard data...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="dashboard">
          <div className="dashboard-error">
            <InlineError message="Failed to load dashboard data" />
            <button onClick={refetch} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats || !academicContext) {
    return (
      <AdminLayout>
        <div className="dashboard">
          <div className="dashboard-error">
            <InlineError message="Dashboard data is incomplete" />
            <button onClick={refetch} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your educational institution</p>
        </div>

        {/* Summary Statistics Section */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Summary Statistics</h2>
          <div className="dashboard-stats-grid">
            <StatCard
              label="Total Students"
              value={stats.totalStudents}
              icon="👥"
              color="primary"
            />
            <StatCard
              label="Total Educators"
              value={stats.totalEducators}
              icon="👨‍🏫"
              color="secondary"
            />
            <StatCard
              label="Active Classes"
              value={stats.activeClasses}
              icon="📚"
              color="success"
            />
            <StatCard
              label="Programs"
              value={stats.programs}
              icon="🎯"
              color="primary"
            />
            <StatCard
              label="Active School Year"
              value={parseInt(stats.activeSchoolYear.split('-')[0]) || 2025}
              icon="📅"
              color="secondary"
            />
            <StatCard
              label="Sections"
              value={stats.sections}
              icon="🏫"
              color="success"
            />
            <StatCard
              label="Pending Tasks"
              value={stats.pendingTasks}
              icon="⏳"
              color="warning"
            />
            <StatCard
              label="Pending Grade Submissions"
              value={stats.pendingGradeSubmissions}
              icon="📝"
              color="warning"
            />
          </div>
        </section>

        {/* Academic Context Section */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Current Academic Context</h2>
          <AcademicContext academicContext={academicContext} />
        </section>

        {/* Alerts Section */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Alerts & Important Notices</h2>
          <div className="dashboard-alerts">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))
            ) : (
              <div className="dashboard-alerts-empty">
                No alerts or important notices at this time.
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};
