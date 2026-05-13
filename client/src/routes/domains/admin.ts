// Admin Domain Registration
// Register all admin pages in the route registry

import { registerPage } from '../utils/registry';
import { AdminDashboard } from '../../pages/admin/AdminDashboard';
import { AdminAcademics } from '../../modules/admin/academic/AdminAcademics';
import { AdminPeople } from '../../pages/admin/AdminPeople';
import { AdminSystem } from '../../modules/admin/system/AdminSystem';
import { AdminSecurity } from '../../pages/admin/AdminSecurity';

export const registerAdminDomain = (): void => {
  // Register admin pages in the centralized registry
  registerPage({
    path: '/admin/dashboard',
    component: AdminDashboard,
    title: 'Admin Dashboard',
    permissions: ['admin'],
    isProtected: true,
    isPublic: false,
  });

  registerPage({
    path: '/admin/academics',
    component: AdminAcademics,
    title: 'Academics',
    permissions: ['admin'],
    isProtected: true,
    isPublic: false,
  });

  registerPage({
    path: '/admin/people',
    component: AdminPeople,
    title: 'People',
    permissions: ['admin'],
    isProtected: true,
    isPublic: false,
  });

  registerPage({
    path: '/admin/system',
    component: AdminSystem,
    title: 'System',
    permissions: ['admin'],
    isProtected: true,
    isPublic: false,
  });

  registerPage({
    path: '/admin/security',
    component: AdminSecurity,
    title: 'Security',
    permissions: ['admin'],
    isProtected: true,
    isPublic: false,
  });
};
