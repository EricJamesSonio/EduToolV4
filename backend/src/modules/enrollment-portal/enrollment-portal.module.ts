// src/modules/enrollment-portal/enrollment-portal.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { EnrollmentPortalController } from './enrollment-portal.controller';
import { EnrollmentPortalService } from './enrollment-portal.service';
import { EnrollmentPortalRepository } from './enrollment-portal.repository';
import { EnrollmentSessionGuard } from './enrollment-session.guard';

@Module({
  imports: [AuthModule],
  controllers: [EnrollmentPortalController],
  providers: [
    EnrollmentPortalService,
    EnrollmentPortalRepository,
    EnrollmentSessionGuard,
  ],
  exports: [EnrollmentPortalService],
})
export class EnrollmentPortalModule {}