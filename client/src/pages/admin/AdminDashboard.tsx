// Admin Dashboard Page
// Main admin dashboard with overview and statistics

import React from 'react';
import AdminLayout from '../../components/AdminLayout';

export const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>System overview and management</p>
        </div>

        <div className="page-content">
          <div className="grid">
            <div className="col-12">
              <div className="card">
                <h2>Welcome to Admin Dashboard</h2>
                <p>This is the main administration interface for EduTool.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
