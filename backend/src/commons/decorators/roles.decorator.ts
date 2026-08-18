// src/commons/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const REGISTRAR_KEY = 'registrar';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Marks a route as registrar-only. Composed into RolesGuard: in addition to the
 * role gate, the authenticated account must have `is_registrar === true`.
 * Reuses the existing guard machinery instead of a bespoke controller check.
 */
export const Registrar = () => SetMetadata(REGISTRAR_KEY, true);
