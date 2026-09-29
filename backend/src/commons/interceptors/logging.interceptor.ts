// src/commons/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { finalize } from 'rxjs/operators';

interface TimedRequest {
  method?: string;
  url?: string;
  requestId?: string;
}

interface TimedResponse {
  statusCode?: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const type = context.getType<string>();

    // finalize() (not tap()) so errored requests are timed too.
    // hrtime.bigint() for monotonic, sub-ms timing instead of Date.now().
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

        // WS/microservice contexts have no HTTP req/res — guard with try/catch
        // so the interceptor never breaks non-HTTP handlers.
        let method: string | undefined;
        let url: string | undefined;
        let requestId: string | undefined;
        let statusCode: number | undefined;

        try {
          if (type === 'http') {
            const req = context.switchToHttp().getRequest<TimedRequest>();
            const res = context.switchToHttp().getResponse<TimedResponse>();
            method = req?.method;
            url = req?.url;
            requestId = req?.requestId;
            statusCode = res?.statusCode;
          }
        } catch {
          // Never let observability break the request path.
        }

        console.log({
          requestId,
          method,
          url,
          statusCode,
          responseTime: `${durationMs.toFixed(2)}ms`,
        });
      }),
    );
  }
}
