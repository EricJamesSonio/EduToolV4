// src/modules/enrollment-portal/enrollment-session.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EnrollmentSessionClaims } from './entity/enrollment-portal.entity';

/**
 * Verifies the short-lived session token issued after OTP verification.
 * The token is signed with the app-wide JWT secret but carries
 * `type: 'enrollment'` claims (NOT an account `sub`), so it can never
 * be used with the account AuthGuard.
 */
@Injectable()
export class EnrollmentSessionGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing enrollment session token');
    }

    try {
      const payload = this.jwtService.verify<EnrollmentSessionClaims>(
        header.slice('Bearer '.length),
      );

      if (payload?.type !== 'enrollment') {
        throw new Error('Not an enrollment session token');
      }

      request.enrollmentSession = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired enrollment session');
    }
  }
}
