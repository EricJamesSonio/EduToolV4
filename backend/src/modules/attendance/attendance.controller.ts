import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AuthGuard } from '../../commons/guards/auth.guard';
import { RoleGuard } from '../../commons/guards/role.guard';
import { Roles } from '../../commons/decorators/roles.decorator';
import { CurrentUser } from '../../commons/decorators/current-user.decorator';
import {
  BulkSetAttendanceDto,
  UpdateAttendanceRecordDto,
  GetSessionsQueryDto,
} from './dto/attendance.dto';

@Controller('classes/:classId/attendance')
@UseGuards(AuthGuard, RoleGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // GET /classes/:classId/attendance/sessions
  @Get('sessions')
  @Roles('admin', 'educator')
  getSessions(
    @Param('classId') classId: string,
    @Query() query: GetSessionsQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.getSessions(classId, user.org_id, query.weekNumber);
  }

  // GET /classes/:classId/attendance/sessions/:sessionId
  @Get('sessions/:sessionId')
  @Roles('admin', 'educator')
  getSession(
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.getSession(classId, sessionId, user.org_id);
  }

  // POST /classes/:classId/attendance/sessions/:sessionId/records
  @Post('sessions/:sessionId/records')
  @Roles('educator', 'admin')
  bulkSetAttendance(
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: BulkSetAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.bulkSetAttendance(
      classId,
      sessionId,
      user.org_id,
      user.id,
      dto,
    );
  }

  // PATCH /classes/:classId/attendance/sessions/:sessionId/records/:recordId
  @Patch('sessions/:sessionId/records/:recordId')
  @Roles('educator', 'admin')
  updateRecord(
    @Param('classId') classId: string,
    @Param('sessionId') sessionId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateAttendanceRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.updateRecord(
      classId,
      sessionId,
      recordId,
      user.org_id,
      user.id,
      dto,
    );
  }
}