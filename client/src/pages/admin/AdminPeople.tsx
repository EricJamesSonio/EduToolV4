// Admin People Page
// User management and administration

import React from 'react';
import AdminLayout from '../../components/AdminLayout';

export const AdminPeople: React.FC = () => {
  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header">
          <h1>People</h1>
          <p>Manage users, roles, and permissions</p>
        </div>

        <div className="page-content">
          <div className="grid">
            <div className="col-12">
              <div className="card">
                <h2>User Management</h2>
                <p>Manage students, educators, administrators, and user permissions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
