import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class MeetingRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Meeting CRUD ──────────────────────────────────────────────────────────

  async create(data: {
    orgId: string;
    classId: string;
    educatorId: string;
    title: string;
    description?: string;
    startTime: Date;
    isEphemeral?: boolean;
  }) {
    return this.db.meeting.create({
      data: {
        org_id: data.orgId,
        class_id: data.classId,
        educator_id: data.educatorId,
        title: data.title,
        description: data.description ?? null,
        start_time: data.startTime,
        status: 'scheduled',
        is_ephemeral: data.isEphemeral ?? false,
      },
      include: { invites: true },
    });
  }

  async findAll(classId: string, orgId: string) {
    return this.db.meeting.findMany({
      where: {
        class_id: classId,
        org_id: orgId,
        deleted_at: null,
        is_ephemeral: false,
      },
      include: { invites: true, join_requests: true },
      orderBy: { start_time: 'asc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.meeting.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      include: { invites: true, join_requests: true },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      startTime?: Date;
    },
  ) {
    return this.db.meeting.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.startTime !== undefined ? { start_time: data.startTime } : {}),
      },
      include: { invites: true },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.db.meeting.update({
      where: { id },
      data: { status },
    });
  }

  async softDelete(id: string) {
    return this.db.meeting.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async hardDelete(id: string) {
    // Invites / join requests hold RESTRICT FKs on the meeting, and orphaned
    // chat rows would leak — remove all dependents before deleting the row.
    return this.db.$transaction([
      this.db.meetingInvite.deleteMany({ where: { meeting_id: id } }),
      this.db.meetingJoinRequest.deleteMany({ where: { meeting_id: id } }),
      this.db.meetingChatMessage.deleteMany({ where: { meeting_id: id } }),
      this.db.meeting.delete({ where: { id } }),
    ]);
  }

  // ── Invites ───────────────────────────────────────────────────────────────

  async createInvites(orgId: string, meetingId: string, studentIds: string[]) {
    if (studentIds.length === 0) return;
    return this.db.meetingInvite.createMany({
      data: studentIds.map((studentId) => ({
        org_id: orgId,
        meeting_id: meetingId,
        student_id: studentId,
      })),
      skipDuplicates: true,
    });
  }

  async replaceInvites(orgId: string, meetingId: string, studentIds: string[]) {
    await this.db.meetingInvite.deleteMany({ where: { meeting_id: meetingId } });
    if (studentIds.length === 0) return;
    return this.db.meetingInvite.createMany({
      data: studentIds.map((studentId) => ({
        org_id: orgId,
        meeting_id: meetingId,
        student_id: studentId,
      })),
    });
  }

  async findInvitedStudentIds(meetingId: string): Promise<string[]> {
    const invites = await this.db.meetingInvite.findMany({
      where: { meeting_id: meetingId },
      select: { student_id: true },
    });
    return invites.map((i) => i.student_id);
  }

  async isStudentInvited(meetingId: string, studentId: string): Promise<boolean> {
    const invite = await this.db.meetingInvite.findFirst({
      where: { meeting_id: meetingId, student_id: studentId },
    });
    return !!invite;
  }

  // ── Join requests ─────────────────────────────────────────────────────────

  async findJoinRequest(meetingId: string, studentId: string) {
    return this.db.meetingJoinRequest.findFirst({
      where: { meeting_id: meetingId, student_id: studentId },
    });
  }

  async createJoinRequest(orgId: string, meetingId: string, studentId: string) {
    return this.db.meetingJoinRequest.create({
      data: {
        org_id: orgId,
        meeting_id: meetingId,
        student_id: studentId,
        status: 'pending',
      },
    });
  }

  async updateJoinRequest(id: string, status: string) {
    return this.db.meetingJoinRequest.update({
      where: { id },
      data: { status },
    });
  }

  async findJoinRequestById(id: string) {
    return this.db.meetingJoinRequest.findFirst({ where: { id } });
  }
}