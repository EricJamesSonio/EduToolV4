import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from '../logging.interceptor';

describe('LoggingInterceptor — Perf Phase 0 observability', () => {
  let interceptor: LoggingInterceptor;
  let logSpy: jest.SpyInstance;

  const makeHttpContext = (
    req: Record<string, unknown>,
    res: Record<string, unknown>,
  ): any => ({
    getType: (): string => 'http',
    switchToHttp: (): unknown => ({
      getRequest: (): unknown => req,
      getResponse: (): unknown => res,
    }),
  });

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('logs method/url/statusCode/responseTime on success', (done) => {
    const ctx = makeHttpContext(
      { method: 'GET', url: '/check', requestId: 'req-1' },
      { statusCode: 200 },
    );
    const next = { handle: (): unknown => of({ ok: true }) };

    interceptor.intercept(ctx, next as never).subscribe({
      // finalize() runs on teardown, after the complete notification reaches
      // the subscriber — defer assertions a tick so the log has been written.
      complete: () => {
        setImmediate(() => {
          try {
            expect(logSpy).toHaveBeenCalledTimes(1);
            const payload = logSpy.mock.calls[0][0] as Record<string, unknown>;
            expect(payload.requestId).toBe('req-1');
            expect(payload.method).toBe('GET');
            expect(payload.url).toBe('/check');
            expect(payload.statusCode).toBe(200);
            expect(typeof payload.responseTime).toBe('string');
            done();
          } catch (err) {
            done(err as Error);
          }
        });
      },
    });
  });

  it('still logs timing when the handler errors (finalize, not tap)', (done) => {
    const ctx = makeHttpContext(
      { method: 'GET', url: '/boom', requestId: 'req-err' },
      { statusCode: 500 },
    );
    const next = {
      handle: (): unknown => throwError(() => new Error('boom')),
    };

    interceptor.intercept(ctx, next as never).subscribe({
      error: () => {
        setImmediate(() => {
          try {
            expect(logSpy).toHaveBeenCalledTimes(1);
            const payload = logSpy.mock.calls[0][0] as Record<string, unknown>;
            expect(payload.requestId).toBe('req-err');
            expect(payload.url).toBe('/boom');
            expect(typeof payload.responseTime).toBe('string');
            done();
          } catch (err) {
            done(err as Error);
          }
        });
      },
    });
  });
});
