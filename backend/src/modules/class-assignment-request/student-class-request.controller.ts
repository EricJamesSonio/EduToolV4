import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClassAssignmentRequestService } from './class-assignment-request.service';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

@Controller('student/class-requests')
@UseGuards(AuthGuard, RolesGuard)
@Roles('student')
export class StudentClassRequestController {
  constructor(private readonly service: ClassAssignmentRequestService) {}

  // GET /student/class-requests/available
  // Everything the request dialog needs: requestable classes, prerequisite-blocked
  // subjects, already-enrolled classes, semesters and the latest request.
  @Get('available')
  getAvailable(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.service.getAvailability(studentId, orgId);
  }
}