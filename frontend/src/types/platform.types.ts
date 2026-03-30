export type AccountStatus = "active" | "suspended";

export interface AdminAccount {
  id: string;
  email: string;
  role: string;
  status: AccountStatus;
  createdAt: string;
  fullName: string | null;
}

export interface AdminCredentials {
  fullName: string;
  email: string;
  password: string;
}