import { Role, AccountStatus } from '@prisma/client';

export class AuthEntity {
  id!: string;
  org_id!: string | null;
  role!: Role;
  email!: string;
  status!: AccountStatus;
  createdAt!: Date;

  // Hydrated from Profile relation
  fullName?: string;
  metadata?: Record<string, any>;
  profileImage?: string | null;
}

export class TokenPayload {
  sub!: string;
  org_id!: string | null;
  role!: Role;
  email!: string;
}

export class AuthTokens {
  accessToken!: string;
  refreshToken!: string;
}
