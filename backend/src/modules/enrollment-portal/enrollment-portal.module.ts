// src/modules/enrollment-portal/enrollment-portal.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { StudentModule } from '@/modules/student/student.module';
import { StudentEnrollmentModule } from '@/modules/student-enrollment/student-enrollment.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { EnrollmentPortalController } from './enrollment-portal.controller';
import { EnrollmentPortalService } from './enrollment-portal.service';
import { EnrollmentPortalRepository } from './enrollment-portal.repository';
import { EnrollmentSessionGuard } from './enrollment-session.guard';
import { EnrollmentRegistrarController } from './registrar/enrollment-registrar.controller';
import { EnrollmentRegistrarService } from './registrar/enrollment-registrar.service';
import { EnrollmentRegistrarRepository } from './registrar/enrollment-registrar.repository';
import { EnrollmentApprovalService } from './registrar/enrollment-approval.service';
import { EnrollmentApprovalRepository } from './registrar/enrollment-approval.repository';
import { EnrollmentAutoLockService } from './registrar/enrollment-auto-lock.service';

@Module({
  imports: [
    AuthModule,
    AuditLogModule,
    StudentModule,
    StudentEnrollmentModule,
    NotificationModule,
  ],
  controllers: [EnrollmentPortalController, EnrollmentRegistrarController],
  providers: [
    EnrollmentPortalService,
    EnrollmentPortalRepository,
    EnrollmentSessionGuard,
    EnrollmentRegistrarService,
    EnrollmentRegistrarRepository,
    EnrollmentApprovalService,
    EnrollmentApprovalRepository,
    EnrollmentAutoLockService,
  ],
  exports: [EnrollmentPortalService, EnrollmentAutoLockService],
})
export class EnrollmentPortalModule {}