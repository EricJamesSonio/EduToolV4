import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/core/database/database.module';
import { GradeModule } from '../grade/grade.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GradeTemplateController } from './grade-template.controller';
import { GradeTemplateService } from './grade-template.service';

@Module({
  imports: [DatabaseModule, GradeModule, AuditLogModule],
  controllers: [GradeTemplateController],
  providers: [GradeTemplateService],
})
export class GradeTemplateModule {}