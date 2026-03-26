// @/modules/lesson/lesson.module.ts
import { Module } from '@nestjs/common';
import { LessonController, StudentLessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { LessonRepository } from './lesson.repository';
import { ClassModule } from '../class/class.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ClassModule, AuditLogModule, NotificationModule],
  controllers: [LessonController, StudentLessonController],
  providers: [LessonService, LessonRepository],
  exports: [LessonService, LessonRepository],
})
export class LessonModule {}