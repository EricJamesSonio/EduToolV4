// Admin Layout Component
// Layout wrapper for admin pages with admin navbar

import React from 'react';
import AdminNavbar from './AdminNavbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
