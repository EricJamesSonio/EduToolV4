// Admin Security Page
// Security settings and access control

import React from 'react';
import AdminLayout from '../../components/AdminLayout';

export const AdminSecurity: React.FC = () => {
  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header">
          <h1>Security</h1>
          <p>Security settings and access control</p>
        </div>

        <div className="page-content">
          <div className="grid">
            <div className="col-12">
              <div className="card">
                <h2>Security Management</h2>
                <p>Configure security policies, access controls, and authentication settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
