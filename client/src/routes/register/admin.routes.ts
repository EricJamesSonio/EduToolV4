import { registerPage } from '../utils/registry';

// Import admin page components
import { AdminDashboard } from '@/modules/admin/dashboard/AdminDashboard';
import { AdminAcademics } from '@/modules/admin/academic/AdminAcademics';
import { AdminPeople } from '@/pages/admin/AdminPeople';
import { AdminSystem } from '@/modules/admin/system/AdminSystem';
import { AdminSecurity } from '@/modules/admin/security/AdminSecurity';

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

// Export admin route configuration for use in AppRoutes
export const adminRoutes = [
  {
    path: '/admin/dashboard',
    component: AdminDashboard,
  },
  {
    path: '/admin/academics',
    component: AdminAcademics,
  },
  {
    path: '/admin/people',
    component: AdminPeople,
  },
  {
    path: '/admin/system',
    component: AdminSystem,
  },
  {
    path: '/admin/security',
    component: AdminSecurity,
  },
];
