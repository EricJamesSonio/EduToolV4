import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from '../health.controller';

describe('HealthController — Perf Phase 0 observability', () => {
  const makeController = (queryRaw: jest.Mock): HealthController => {
    const db = { $queryRaw: queryRaw } as unknown as ConstructorParameters<
      typeof HealthController
    >[0];
    return new HealthController(db);
  };

  it('GET / keeps its existing shape (status/message/timestamp)', () => {
    const controller = makeController(jest.fn());

    const res = controller.root();

    expect(res.status).toBe('ok');
    expect(res.message).toBe('Backend is running 🚀');
    expect(res.timestamp).toBeInstanceOf(Date);
  });

  it('GET /check pings the DB and reports latency', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const controller = makeController(queryRaw);

    const res = await controller.check();

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(res.status).toBe('ok');
    expect(res.database).toBe('up');
    expect(typeof res.dbLatencyMs).toBe('number');
  });

  it('GET /check throws 503 when the DB is unreachable', async () => {
    const queryRaw = jest.fn().mockRejectedValue(new Error('conn refused'));
    const controller = makeController(queryRaw);

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
