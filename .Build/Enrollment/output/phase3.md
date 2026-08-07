Phase 3 (Registrar-Side API) is done and verified.
What was built
Audit-driven, reused existing patterns — no reinvention.
Files (under backend/src/modules/enrollment-portal/registrar/):

- enrollment-registrar.controller.ts — admin/enrollment-portal, gated @UseGuards(AuthGuard, RolesGuard) + @Roles('admin') + @Registrar()
- enrollment-registrar.service.ts
- enrollment-registrar.repository.ts (reuses the existing student.repository.ts pagination shape)
- dto/enrollment-registrar.dto.ts
  Guard change (composed into the existing guard, per Phase 1 ask):
- commons/decorators/roles.decorator.ts — added @Registrar() + REGISTRAR_KEY
- commons/guards/role.guard.ts — honors REGISTRAR_KEY: requires user.is_registmar === true alongside the role check
- auth/strategies/jwt.strategy.ts — now surfaces is_registrar on req.user
  Endpoints
- Periods: POST/GET /periods, PATCH/DELETE /periods/:id (delete guarded against referenced applications)
- Applications: GET /applications (search/paginated by code/email/status/period), GET /applications/:id, approve/reject/unlock
  Acceptance verified live (built & restarted server):
- approve/reject/unlock each produce exactly one AuditLog entry — checked audit reject entries = 1
- Reused existing pagination helper (no second implementation)
- Registrar gating via the guard, not inline: is_registrar=false → 403 Registrar access required; true → 200
- re-review of approved/locked → 409; unlock non-locked → 409; unlock with no email/code → 400
  Note: is_registrar already existed on Account (schema) but wasn't on req.user — I wired it through. Test rows cleaned up after verification.
  Ready for Phase 4 (approve → student/section creation + notification wiring) when you are.
