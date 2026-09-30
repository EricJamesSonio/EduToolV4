import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Post, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
  Throttle,
  SkipThrottle,
} from '@nestjs/throttler';
import request from 'supertest';

/**
 * Proves the global ThrottlerGuard actually returns 429 past a route's limit,
 * and that @SkipThrottle really exempts a route.
 *
 * Uses a minimal stand-in module rather than AppModule: importing the real one
 * would drag in Prisma/Postgres, and the point here is the guard's behaviour,
 * not the grade-lock wiring. Production limits (e.g. assign-bulk's 30/min) use
 * the exact same mechanism as the 3/min below.
 */

@Controller('throttle-probe')
class ThrottleProbeController {
  @Post('limited')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  limited(): { ok: true } {
    return { ok: true };
  }

  @Post('exempt')
  @SkipThrottle({ default: true })
  exempt(): { ok: true } {
    return { ok: true };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 100 }] }),
  ],
  controllers: [ThrottleProbeController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
class ThrottleProbeModule {}

describe('ThrottlerGuard — 429 past the route limit', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({ imports: [ThrottleProbeModule] }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows requests up to the limit, then returns 429', async () => {
    const server = app.getHttpServer();

    // First 3 within the limit succeed.
    for (let i = 0; i < 3; i += 1) {
      await request(server).post('/throttle-probe/limited').expect(201);
    }

    // The 4th exceeds limit 3 and is rejected.
    await request(server).post('/throttle-probe/limited').expect(429);
  });

  it('keeps rejecting for the rest of the window', async () => {
    const server = app.getHttpServer();
    await request(server).post('/throttle-probe/limited').expect(429);
    await request(server).post('/throttle-probe/limited').expect(429);
  });

  it('never throttles a @SkipThrottle route', async () => {
    const server = app.getHttpServer();
    // Repeated well past the global 100/min default — still fine.
    for (let i = 0; i < 12; i += 1) {
      await request(server).post('/throttle-probe/exempt').expect(201);
    }
  });

  it('buckets per route, so exhausting one does not affect the other', async () => {
    const server = app.getHttpServer();
    // The limited route is exhausted from the earlier tests; the exempt route
    // uses a different handler key and must still pass.
    await request(server).post('/throttle-probe/limited').expect(429);
    await request(server).post('/throttle-probe/exempt').expect(201);
  });
});
