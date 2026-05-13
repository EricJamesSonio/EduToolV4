export type AuthRole =
  | 'admin'
  | 'educator'
  | 'student'
  | 'parent'
  | 'platform_owner'
  | string;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface UserProfile {
  id: string;
  orgId: string | null;
  role: AuthRole;
  email: string;
  status: string;
  fullName: string | null;
  metadata: unknown;
  createdAt: string;
  personalEmail: string | null;
}

export const getRoleHomePath = (role: AuthRole): string => {
  switch (role) {
    case 'admin':
    case 'platform_owner':
      return '/admin/dashboard';
    case 'educator':
      return '/educator/dashboard';
    case 'student':
      return '/student/dashboard';
    case 'parent':
      return '/parent/dashboard';
    default:
      return '/';
  }
};
