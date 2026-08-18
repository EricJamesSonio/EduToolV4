// src/commons/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, REGISTRAR_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user || !requiredRoles.includes(user.role)) {
        throw new ForbiddenException('Access denied');
      }
    }

    const registrarRequired = this.reflector.getAllAndOverride<boolean>(
      REGISTRAR_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (registrarRequired) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // Admins can perform registrar duties regardless of their flag; a
      // non-admin needs the dedicated registrar capability.
      const isAdmin = user?.role === 'admin';
      if (!user || (!isAdmin && user.is_registrar !== true)) {
        throw new ForbiddenException('Registrar access required');
      }
    }

    return true;
  }
}
