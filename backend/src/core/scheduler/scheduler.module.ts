// src/core/scheduler/scheduler.module.ts
import { Module } from '@nestjs/common';
import { SchedulerTasks } from './scheduler.tasks';
import { GradeLockModule } from '@/modules/grade-lock/grade-lock.module';
import { SubmissionModule } from '@/modules/submission/submission.module';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [GradeLockModule, SubmissionModule, NotificationModule],
  providers: [SchedulerTasks],
})
export class SchedulerModule {}