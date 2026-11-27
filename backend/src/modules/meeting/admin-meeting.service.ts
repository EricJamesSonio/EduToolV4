import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AgoraTokenService } from './agora-token.service';
import { MeetingGateway } from './meeting.gateway';

@Injectable()
export class AdminMeetingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: MeetingGateway,
    private readonly agoraTokenService: AgoraTokenService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findLive(orgId: string) {
    const meetings = await this.db.meeting.findMany({
      where: { org_id: orgId, status: 'active', deleted_at: null },
      include: {
        class: {
          include: {
            subject: { select: { name: true, code: true } },
            educator: {
              select: {
                id: true,
                profile: { select: { full_name: true } },
              },
            },
          },
        },
      },
      orderBy: { start_time: 'asc' },
    });

    return meetings
      .map((m) => {
        const participants = this.gateway.getParticipants(m.id).map((p) => ({
          userId: p.userId,
          name: p.name,
          role: p.role,
          handRaised: p.handRaised,
          uid: this.agoraTokenService.uidFor(p.userId),
        }));

        return {
          id: m.id,
          title: m.title,
          description: m.description,
          classId: m.class_id,
          subjectName: m.class?.subject?.name ?? 'Class',
          subjectCode: m.class?.subject?.code ?? null,
          educatorId: m.educator_id,
          educatorName: m.class?.educator?.profile?.full_name ?? 'Educator',
          startTime: m.start_time,
          isEphemeral: m.is_ephemeral,
          participantCount: participants.length,
          participants,
        };
      })
      .filter((m) => m.participantCount > 0);
  }

  async issueToken(meetingId: string, orgId: string, adminId: string) {
    const result = await this.agoraTokenService.getToken(
      meetingId,
      orgId,
      adminId,
      'admin',
    );

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: adminId,
      action: 'meeting_observed',
      entityType: 'meeting',
      entityId: meetingId,
      metadata: { meetingId },
    });

    return result;
  }
}