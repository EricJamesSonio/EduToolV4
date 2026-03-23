// src/modules/auth/entity/auth.entity.ts
import { Role, AccountStatus } from '@prisma/client';

export class AuthEntity {
  id: string;
  orgId: string | null;
  role: Role;
  email: string;
  status: AccountStatus;
  createdAt: Date;

  // Hydrated from Profile relation
  fullName?: string;
  metadata?: Record<string, any>;
}

export class TokenPayload {
  sub: string;       // account id
  orgId: string | null;
  role: Role;
  email: string;
}

export class AuthTokens {
  accessToken: string;
  refreshToken: string;
}