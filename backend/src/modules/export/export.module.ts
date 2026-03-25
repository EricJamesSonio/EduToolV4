import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { GradeModule } from '../grade/grade.module';

@Module({
  imports: [GradeModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}