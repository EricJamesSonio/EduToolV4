// src/commons/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const REGISTRAR_KEY = 'registrar';
export const REGISTRAR_ACCESS_KEY = 'registrarAccess';

export type RegistrarAccess = 'none' | 'read' | 'full';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Marks a route as registrar-only. Composed into RolesGuard: in addition to the
 * role gate, the authenticated account must have `is_registrar === true`.
 * Reuses the existing guard machinery instead of a bespoke controller check.
 */
export const Registrar = () => SetMetadata(REGISTRAR_KEY, true);

/**
 * Registrar accounts (role admin + is_registrar) are denied on this route.
 * Method-level metadata overrides class-level metadata.
 */
export const AdminOnly = () =>
  SetMetadata<string, RegistrarAccess>(REGISTRAR_ACCESS_KEY, 'none');

/**
 * Registrar accounts may only send GET/HEAD/OPTIONS requests here.
 * Method-level metadata overrides class-level metadata.
 */
export const RegistrarReadOnly = () =>
  SetMetadata<string, RegistrarAccess>(REGISTRAR_ACCESS_KEY, 'read');

/**
 * Registrar accounts have full access here. Use on a method to override a
 * class-level AdminOnly or RegistrarReadOnly.
 */
export const RegistrarAllowed = () =>
  SetMetadata<string, RegistrarAccess>(REGISTRAR_ACCESS_KEY, 'full');