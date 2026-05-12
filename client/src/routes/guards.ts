// Route Guards and Permission System
// Cookie-based authentication guards

import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface GuardContext {
  isAuthenticated?: boolean;
  permissions?: string[];
  userRole?: string;
}

export interface GuardProps {
  children: React.ReactNode;
  context?: GuardContext;
}

// Check if user is authenticated via access token
const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem('accessToken');
  return !!accessToken;
};

// Auth Guard - Checks if user is authenticated
export const AuthGuard = ({ children }: GuardProps): React.ReactNode => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  if (!isAuthenticated()) {
    return React.createElement('div', null, 'Redirecting to login...');
  }

  return React.createElement(React.Fragment, null, children);
};

// Permission Guard - Checks if user has required permissions
export const PermissionGuard = ({ children, context }: GuardProps): React.ReactNode => {
  // TODO: Implement actual permission check
  // For now, always allow access (starter implementation)
  const userPermissions = context?.permissions ?? [];
  const requiredPermissions: string[] = []; // Would be passed as props

  const hasPermission = requiredPermissions.every(perm =>
    userPermissions.includes(perm)
  );

  if (!hasPermission) {
    return React.createElement('div', null, 'You don\'t have permission to access this page');
  }

  return React.createElement(React.Fragment, null, children);
};

// Role Guard - Checks if user has required role
export const RoleGuard = ({ children, context }: GuardProps): React.ReactNode => {
  // TODO: Implement actual role check
  // For now, always allow access (starter implementation)
  const userRole = context?.userRole;
  const requiredRoles: string[] = []; // Would be passed as props

  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole || '')) {
    return React.createElement('div', null, 'You don\'t have the required role to access this page');
  }

  return React.createElement(React.Fragment, null, children);
};

// Compose multiple guards
export const composeGuards = (
  guards: Array<(props: GuardProps) => React.ReactNode>,
  props: GuardProps
): React.ReactNode => {
  return guards.reduce((acc, Guard) => React.createElement(Guard, props, acc), props.children);
};
