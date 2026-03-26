import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeetingService } from './meeting.service';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  RespondJoinRequestDto,
} from './dto/meeting.dto';
import { AuthGuard } from '@/commons/guards/auth.guard';
import { RolesGuard } from '@/commons/guards/role.guard';
import { Roles } from '@/commons/decorators/roles.decorator';
import { CurrentUser } from '@/commons/decorators/current-user.decorator';

// ── Educator routes ───────────────────────────────────────────────────────────

@Controller('classes/:classId/meetings')
@UseGuards(AuthGuard, RolesGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post()
  @Roles('educator')
  create(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingService.create(classId, orgId, educatorId, dto);
  }

  @Get()
  @Roles('educator')
  findAll(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.meetingService.findAll(classId, orgId, educatorId);
  }

  @Get(':id')
  @Roles('educator')
  findOne(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.meetingService.findOne(id, classId, orgId, educatorId);
  }

  @Patch(':id')
  @Roles('educator')
  update(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingService.update(id, classId, orgId, educatorId, dto);
  }

  @Delete(':id')
  @Roles('educator')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    await this.meetingService.remove(id, classId, orgId, educatorId);
  }

  @Post(':id/end')
  @Roles('educator')
  @HttpCode(HttpStatus.OK)
  endMeeting(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
  ) {
    return this.meetingService.endMeeting(id, classId, orgId, educatorId);
  }
}

// ── Cross-class educator routes (join requests) ───────────────────────────────

@Controller('meetings')
@UseGuards(AuthGuard, RolesGuard)
export class MeetingJoinController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post(':id/join-request')
  @Roles('student')
  requestJoin(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.meetingService.requestJoin(id, orgId, studentId);
  }

  @Patch(':id/join-request/:reqId')
  @Roles('educator')
  respondToJoinRequest(
    @Param('id') id: string,
    @Param('reqId') reqId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') educatorId: string,
    @Body() dto: RespondJoinRequestDto,
  ) {
    return this.meetingService.respondToJoinRequest(
      id, reqId, orgId, educatorId, dto,
    );
  }
}

// ── Student routes ────────────────────────────────────────────────────────────

@Controller('student/classes/:classId/meetings')
@UseGuards(AuthGuard, RolesGuard)
export class StudentMeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get()
  @Roles('student')
  findAll(
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.meetingService.findAllForStudent(classId, orgId, studentId);
  }

  @Get(':id')
  @Roles('student')
  findOne(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.meetingService.findOneForStudent(id, classId, orgId, studentId);
  }
}