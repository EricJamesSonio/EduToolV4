import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { MeetingRepository } from './meeting.repository';
import { MeetingGateway } from './meeting.gateway';
import { ClassRepository } from '../class/class.repository';
import { EnrollmentRepository } from '../enrollment/enrollment.repository';
import { NotificationService } from '../notification/notification.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  RespondJoinRequestDto,
} from './dto/meeting.dto';

@Injectable()
export class MeetingService {
  constructor(
    private readonly meetingRepo: MeetingRepository,
    private readonly classRepo: ClassRepository,
    private readonly enrollmentRepo: EnrollmentRepository,
    private readonly notificationService: NotificationService,
    private readonly auditLog: AuditLogService,
    private readonly meetingGateway: MeetingGateway,
  ) {}

  // ── POST /classes/:classId/meetings ───────────────────────────────────────

  async create(
    classId: string,
    orgId: string,
    educatorId: string,
    dto: CreateMeetingDto,
  ) {
    const cls = await this.classRepo.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    if (cls.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    const meeting = await this.meetingRepo.create({
      orgId,
      classId,
      educatorId,
      title: dto.title,
      description: dto.description,
      startTime: new Date(dto.startTime),
      isEphemeral: dto.ephemeral ?? false,
    });

    // Resolve invited student IDs
    // If none provided → invite all active enrollments
    let invitedIds = dto.invitedStudentIds ?? [];
    if (invitedIds.length === 0) {
      const enrollments = await this.enrollmentRepo.findByClass(classId, orgId);
      invitedIds = enrollments.map((e: any) => e.student_id);
    }

    await this.meetingRepo.createInvites(orgId, meeting.id, invitedIds);

    // Notify all invited students
    await this.notificationService.createBulkNotifications(
      invitedIds.map((studentId) => ({
        orgId,
        accountId: studentId,
        type: 'meeting_created',
        payload: {
          meetingId: meeting.id,
          title: meeting.title,
          startTime: meeting.start_time,
          classId,
        },
      })),
    );

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'meeting_created',
      entityType: 'class',
      entityId: classId,
      metadata: { meetingId: meeting.id, title: meeting.title },
    });

    return this.meetingRepo.findById(meeting.id, orgId);
  }

  // ── GET /classes/:classId/meetings ────────────────────────────────────────

  async findAll(classId: string, orgId: string, educatorId: string) {
    const cls = await this.classRepo.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    if (cls.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    return this.meetingRepo.findAll(classId, orgId);
  }

  // ── GET /classes/:classId/meetings/:id ───────────────────────────────────

  async findOne(id: string, classId: string, orgId: string, educatorId: string) {
    const cls = await this.classRepo.findById(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');
    if (cls.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }

    const meeting = await this.meetingRepo.findById(id, orgId);
    if (!meeting || meeting.class_id !== classId) {
      throw new NotFoundException('Meeting not found.');
    }

    return meeting;
  }

  // ── PATCH /classes/:classId/meetings/:id ─────────────────────────────────

  async update(
    id: string,
    classId: string,
    orgId: string,
    educatorId: string,
    dto: UpdateMeetingDto,
  ) {
    const meeting = await this.assertEducatorOwnsMeeting(
      id, classId, orgId, educatorId,
    );

    if (meeting.status === 'ended') {
      throw new BadRequestException('Cannot update an ended meeting.');
    }

    if (dto.invitedStudentIds !== undefined) {
      await this.meetingRepo.replaceInvites(orgId, id, dto.invitedStudentIds);
    }

    return this.meetingRepo.update(id, {
      title: dto.title,
      description: dto.description,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
    });
  }

  // ── DELETE /classes/:classId/meetings/:id ────────────────────────────────

  async remove(id: string, classId: string, orgId: string, educatorId: string) {
    await this.assertEducatorOwnsMeeting(id, classId, orgId, educatorId);
    return this.meetingRepo.softDelete(id);
  }

  // ── POST /classes/:classId/meetings/:id/end ──────────────────────────────

  async endMeeting(
    id: string,
    classId: string,
    orgId: string,
    educatorId: string,
  ) {
    let meeting;
    try {
      meeting = await this.assertEducatorOwnsMeeting(
        id, classId, orgId, educatorId,
      );
    } catch (err) {
      // Already gone — e.g. an ephemeral Groupy meeting hard-deleted the
      // moment its room emptied, or a duplicate end call raced in. Ending an
      // already-ended meeting is a no-op, so treat it as success instead of
      // surfacing a 404 to the client.
      if (err instanceof NotFoundException) {
        return { success: true, message: 'Meeting already ended.' };
      }
      throw err;
    }

    if (meeting.status === 'ended') {
      return { success: true, message: 'Meeting already ended.' };
    }

    // Ephemeral (Groupy) meetings are fully removed when ended — they aren't
    // stored on the meetings pages and have no post-meeting record.
    if (meeting.is_ephemeral) {
      await this.meetingRepo.hardDelete(id);
    } else {
      await this.meetingRepo.updateStatus(id, 'ended');

      await this.auditLog.logActivityEvent({
        orgId,
        actorId: educatorId,
        action: 'meeting_ended',
        entityType: 'class',
        entityId: classId,
        metadata: { meetingId: id },
      });
    }

    // Kick everyone still connected out of the room so no one lingers in a
    // session that no longer exists (or is now closed).
    this.meetingGateway.server.to(id).emit('meeting:ended', { meetingId: id });

    return { success: true, message: 'Meeting ended.' };
  }

  // ── POST /meetings/:id/join-request (student) ─────────────────────────────

  async requestJoin(id: string, orgId: string, studentId: string) {
    const meeting = await this.meetingRepo.findById(id, orgId);
    if (!meeting) throw new NotFoundException('Meeting not found.');

    if (meeting.status === 'ended') {
      throw new BadRequestException('This meeting has already ended.');
    }

    // Check if student is already invited — no need to request
    const isInvited = await this.meetingRepo.isStudentInvited(id, studentId);
    if (isInvited) {
      throw new ConflictException(
        'You are already invited to this meeting.',
      );
    }

    // Check for existing pending request
    const existing = await this.meetingRepo.findJoinRequest(id, studentId);
    if (existing) {
      throw new ConflictException(
        'You already have a pending join request for this meeting.',
      );
    }

    const request = await this.meetingRepo.createJoinRequest(
      orgId, id, studentId,
    );

    // Notify educator
    await this.notificationService.createNotification({
      orgId,
      accountId: meeting.educator_id,
      type: 'meeting_join_request',
      payload: {
        meetingId: id,
        studentId,
        requestId: request.id,
        title: meeting.title,
      },
    });

    return request;
  }

  // ── PATCH /meetings/:id/join-request/:reqId (educator) ───────────────────

  async respondToJoinRequest(
    id: string,
    reqId: string,
    orgId: string,
    educatorId: string,
    dto: RespondJoinRequestDto,
  ) {
    const meeting = await this.meetingRepo.findById(id, orgId);
    if (!meeting) throw new NotFoundException('Meeting not found.');

    if (meeting.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this meeting.');
    }

    const request = await this.meetingRepo.findJoinRequestById(reqId);
    if (!request || request.meeting_id !== id) {
      throw new NotFoundException('Join request not found.');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('This request has already been responded to.');
    }

    const updated = await this.meetingRepo.updateJoinRequest(reqId, dto.status);

    // If accepted → add student as invite so they can enter
    if (dto.status === 'accepted') {
      await this.meetingRepo.createInvites(orgId, id, [request.student_id]);

      await this.notificationService.createNotification({
        orgId,
        accountId: request.student_id,
        type: 'meeting_join_accepted',
        payload: { meetingId: id, title: meeting.title },
      });
    }

    return updated;
  }

  // ── GET /student/classes/:classId/meetings ────────────────────────────────

  async findAllForStudent(
    classId: string,
    orgId: string,
    studentId: string,
  ) {
    await this.assertStudentEnrolled(classId, studentId, orgId);

    const meetings = await this.meetingRepo.findAll(classId, orgId);

    // For each meeting mark if student is invited or has a join request
    return meetings.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      startTime: m.start_time,
      status: m.status,
      isInvited: m.invites.some((i: any) => i.student_id === studentId),
      joinRequest: m.join_requests.find(
        (r: any) => r.student_id === studentId,
      ) ?? null,
    }));
  }

  // ── GET /student/classes/:classId/meetings/:id ────────────────────────────

  async findOneForStudent(
    id: string,
    classId: string,
    orgId: string,
    studentId: string,
  ) {
    await this.assertStudentEnrolled(classId, studentId, orgId);

    const meeting = await this.meetingRepo.findById(id, orgId);
    if (!meeting || meeting.class_id !== classId) {
      throw new NotFoundException('Meeting not found.');
    }

    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.start_time,
      status: meeting.status,
      isInvited: meeting.invites.some((i: any) => i.student_id === studentId),
      joinRequest: meeting.join_requests.find(
        (r: any) => r.student_id === studentId,
      ) ?? null,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async assertEducatorOwnsMeeting(
    id: string,
    classId: string,
    orgId: string,
    educatorId: string,
  ) {
    const meeting = await this.meetingRepo.findById(id, orgId);
    if (!meeting || meeting.class_id !== classId) {
      throw new NotFoundException('Meeting not found.');
    }
    if (meeting.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this meeting.');
    }
    return meeting;
  }

  private async assertStudentEnrolled(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    const enrollment = await this.enrollmentRepo.findOneByStudentAndClass(
      classId, studentId, orgId,
    );
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this class.');
    }
  }
}