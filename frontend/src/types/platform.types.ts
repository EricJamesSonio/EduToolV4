export type AccountStatus = "active" | "blocked";

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  status: AccountStatus;
  createdAt: string;
  lastLogin: string | null;
  /** Only present immediately after creation or password reset */
  password?: string;
}

export interface AdminCredentials {
  fullName: string;
  email: string;
  password: string;
}