// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { CoreModule } from './core/core.module';

import { AcademicDomainModule } from './domains/academic/academic-domain.module';
import { UserDomainModule } from './domains/user/user-domain.module';
import { ClassDomainModule } from './domains/class/class-domain.module';
import { AssessmentDomainModule } from './domains/assessment/assessment-domain.module';
import { SystemDomainModule } from './domains/system/system-domain.module';
import { PlatformDomainModule } from './domains/platform/platform-domain.module';
import { SchedulerModule } from './core/scheduler/scheduler.module';

import { HealthModule } from './modules/health/health.module';import { UploadModule } from './modules/upload/upload.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PublicModule } from './modules/public/public.module';
import { EnrollmentPortalModule } from './modules/enrollment-portal/enrollment-portal.module';
import { ConcernModule } from './modules/concern/concern.module';
import { GroupyModule } from './modules/groupy/groupy.module';
import { RequestIdMiddleware } from './core/middleware/request-id.middleware';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    // Global HTTP rate limit. Generous default (100 req/min per IP) — the
    // sensitive routes (auth login, OTP, platform login, assign-bulk) tighten
    // it with @Throttle; health and the WebSocket gateways are exempt with
    // @SkipThrottle. Keys on req.ip, which is why main.ts configures
    // `trust proxy` (see core/config/trust-proxy.util.ts).
    //
    // STORAGE: this is the default in-memory store, which is per-process. It
    // is correct for a single instance. If the API is ever scaled to multiple
    // instances, each would keep its own counters and the effective limit
    // would multiply by the instance count — add a shared storage adapter
    // (e.g. @nest-lab/throttler-storage-redis) at that point.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),

    CoreModule,
    SchedulerModule,
    AcademicDomainModule,
    UserDomainModule,
    ClassDomainModule,
    AssessmentDomainModule,
    SystemDomainModule,
    PlatformDomainModule,

    OrganizationModule,
    ProfileModule,
    PublicModule,
    EnrollmentPortalModule,
    ConcernModule,
    GroupyModule,

    HealthModule,
    UploadModule,
  ],
  providers: [
    // Registered FIRST so the throttle check runs before any controller-level
    // guard. AuthGuard/RolesGuard are applied per-controller via @UseGuards
    // and are unaffected by this ordering.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Perf Phase 0: actually apply RequestIdMiddleware so
    // req['requestId'] / X-Request-Id are set for LoggingInterceptor.
    // Exclude nothing — cheap uuid per request, needed for log correlation.
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
