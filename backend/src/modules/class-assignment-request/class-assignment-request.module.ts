import { Module } from '@nestjs/common';
import { ClassAssignmentRequestController } from './class-assignment-request.controller';
import { StudentClassRequestController } from './student-class-request.controller';
import { ClassAssignmentRequestService } from './class-assignment-request.service';
import { ClassAssignmentRequestRepository } from './class-assignment-request.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SubjectPrerequisiteModule } from '../subject-prerequisite/subject-prerequisite.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AuditLogModule, SubjectPrerequisiteModule, NotificationModule],
  controllers: [ClassAssignmentRequestController, StudentClassRequestController],
  providers: [ClassAssignmentRequestService, ClassAssignmentRequestRepository],
  exports: [ClassAssignmentRequestService, ClassAssignmentRequestRepository],
})
export class ClassAssignmentRequestModule {}