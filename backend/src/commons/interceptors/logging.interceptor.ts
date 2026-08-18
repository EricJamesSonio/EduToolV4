// src/commons/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const requestId = req['requestId'];

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const time = Date.now() - now;

        console.log({
          requestId,
          method,
          url,
          responseTime: `${time}ms`,
        });
      }),
    );
  }
}
