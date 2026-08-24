import { Module } from '@nestjs/common';
import { AcademicHistoryAdminController } from './admin/academic-history-admin.controller';
import { AcademicHistoryStudentController } from './student/academic-history-student.controller';
import { AcademicHistoryService } from './academic-history.service';
import { AcademicHistoryRepository } from './academic-history.repository';

@Module({
  controllers: [AcademicHistoryAdminController, AcademicHistoryStudentController],
  providers: [AcademicHistoryService, AcademicHistoryRepository],
  exports: [AcademicHistoryService],
})
export class AcademicHistoryModule {}
