// src/modules/auth/admin-request-session.decorator.ts
// Mirrors the Enrollment Portal's session decorator, but for the admin-request
// session (type: 'admin-request'), reading from request.adminRequestSession.

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AdminRequestSession = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const session = request.adminRequestSession;
    return data ? session?.[data] : session;
  },
);
