// src/app.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { CoreModule } from './core/core.module';

import { AcademicDomainModule } from './domains/academic/academic-domain.module';
import { UserDomainModule } from './domains/user/user-domain.module';
import { ClassDomainModule } from './domains/class/class-domain.module';
import { AssessmentDomainModule } from './domains/assessment/assessment-domain.module';
import { SystemDomainModule } from './domains/system/system-domain.module';
import { PlatformDomainModule } from './domains/platform/platform-domain.module';
import { SchedulerModule } from './core/scheduler/scheduler.module';

import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), 
    // ServeStaticModule removed — frontend is served by Next.js

    CoreModule,
    SchedulerModule,
    AcademicDomainModule,
    UserDomainModule,
    ClassDomainModule,
    AssessmentDomainModule,
    SystemDomainModule,
    PlatformDomainModule,

    HealthModule,
  ],
})
export class AppModule {}