// src/app.module.ts
import { Module } from '@nestjs/common';
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

import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ProfileModule } from './modules/profile/profile.module';
import { PublicModule } from './modules/public/public.module';
import { EnrollmentPortalModule } from './modules/enrollment-portal/enrollment-portal.module';
import { ConcernModule } from './modules/concern/concern.module';
import { GroupyModule } from './modules/groupy/groupy.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),

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
})
export class AppModule {}
