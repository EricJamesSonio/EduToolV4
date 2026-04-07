// @/modules/auth/entity/auth.entity.ts
import { Role, AccountStatus } from '@prisma/client';

export class AuthEntity {
  id: string;
  org_id: string | null;   // ✅ changed from orgId to org_id
  role: Role;
  email: string;
  status: AccountStatus;
  createdAt: Date;

  // Hydrated from Profile relation
  fullName?: string;
  metadata?: Record<string, any>;
}

export class TokenPayload {
  sub: string;             // account id
  org_id: string | null;   // ✅ changed from orgId to org_id
  role: Role;
  email: string;
}

export class AuthTokens {
  accessToken: string;
  refreshToken: string;
}