// Admin Academics Page
// Academic management and configuration

import React from 'react';
import AdminLayout from '../../components/AdminLayout';

export const AdminAcademics: React.FC = () => {
  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header">
          <h1>Academics</h1>
          <p>Manage academic programs and curriculum</p>
        </div>

        <div className="page-content">
          <div className="grid">
            <div className="col-12">
              <div className="card">
                <h2>Academic Management</h2>
                <p>Configure academic programs, courses, and curriculum settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
