// src/core/scheduler/scheduler.module.ts
import { Module } from '@nestjs/common';
import { SchedulerTasks } from './scheduler.tasks';
import { GradeLockModule } from '@/modules/grade-lock/grade-lock.module';
import { SubmissionModule } from '@/modules/submission/submission.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { OrgEnrollmentSettingModule } from '@/modules/org-enrollment-setting/org-enrollment-setting.module';

@Module({
  imports: [GradeLockModule, SubmissionModule, NotificationModule, OrgEnrollmentSettingModule],
  providers: [SchedulerTasks],
})
export class SchedulerModule {}