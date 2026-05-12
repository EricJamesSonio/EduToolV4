// Admin System Page
// System configuration and maintenance

import React from 'react';
import AdminLayout from '../../components/AdminLayout';

export const AdminSystem: React.FC = () => {
  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header">
          <h1>System</h1>
          <p>System configuration and maintenance</p>
        </div>

        <div className="page-content">
          <div className="grid">
            <div className="col-12">
              <div className="card">
                <h2>System Configuration</h2>
                <p>Configure system settings, maintenance, and operational parameters.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
