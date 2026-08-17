// src/modules/enrollment-portal/enrollment-session.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const EnrollmentSession = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const session = request.enrollmentSession;
    return data ? session?.[data] : session;
  },
);
