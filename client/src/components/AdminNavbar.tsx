// Admin Navbar Component
// Navigation bar for admin portal with role-based tabs

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin navigation items
  const navItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
    },
    {
      path: '/admin/academics',
      label: 'Academics',
    },
    {
      path: '/admin/people',
      label: 'People',
    },
    {
      path: '/admin/system',
      label: 'System',
    },
    {
      path: '/admin/security',
      label: 'Security',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar admin-navbar">
      {/* Admin Brand */}
      <div className="navbar-brand">
        <div className="navbar-logo admin-logo">
          Admin
        </div>
        <span>Admin Portal</span>
      </div>

      {/* Desktop Navigation */}
      <ul className="navbar-nav desktop-nav">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <button
              className={`nav-link admin-nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* User Actions */}
      <div className="navbar-actions">
        <div className="user-info">
          <span className="user-name">{user?.fullName || user?.email}</span>
          <span className="user-role">Administrator</span>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className="navbar-toggle mobile-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle admin navigation menu"
        aria-expanded={isMobileMenuOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Mobile Navigation */}
      <ul className={`navbar-nav mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <button
              className={`nav-link admin-nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
        <li className="nav-item mobile-logout">
          <button className="logout-button mobile" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default AdminNavbar;
