import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/core/database/database.module';
import { GradeModule } from '../grade/grade.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GradeTemplateController } from './grade-template.controller';
import { GradeTemplateService } from './grade-template.service';
import { GradeTemplateViewController } from './grade-template-view.controller';
import { GradeTemplateViewService } from './grade-template-view.service';

@Module({
  imports: [DatabaseModule, GradeModule, AuditLogModule],
  controllers: [GradeTemplateController, GradeTemplateViewController],
  providers: [GradeTemplateService, GradeTemplateViewService],
})
export class GradeTemplateModule {}