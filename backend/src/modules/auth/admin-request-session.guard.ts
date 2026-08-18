// src/modules/auth/admin-request-session.guard.ts
// Mirrors the Enrollment Portal's short-lived session guard. The token is
// signed with the app-wide JWT secret but carries `type: 'admin-request'`
// claims (NOT an account `sub`), so it can never be used with the account
// AuthGuard.

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminRequestSessionClaims } from './entity/admin-request-session.entity';

@Injectable()
export class AdminRequestSessionGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing admin request session token');
    }

    try {
      const payload = this.jwtService.verify<AdminRequestSessionClaims>(
        header.slice('Bearer '.length),
      );

      if (payload?.type !== 'admin-request') {
        throw new Error('Not an admin request session token');
      }

      request.adminRequestSession = payload;
      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired admin request session',
      );
    }
  }
}
