// @/modules/transcript/student/transcript-student.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { TranscriptStudentService } from './transcript-student.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('student/transcript')
@UseGuards(AuthGuard, RolesGuard)
export class TranscriptStudentController {
  constructor(private readonly service: TranscriptStudentService) {}

  // GET /student/transcript
  @Get()
  @Roles('student')
  getMyTranscript(
    @CurrentUser('id') studentId: string,
    @CurrentUser('org_id') orgId: string,
  ) {
    return this.service.getMyTranscript(studentId, orgId);
  }
}