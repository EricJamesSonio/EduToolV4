import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { MeetingService } from '../meeting/meeting.service';
import { CreateMeetingDto } from '../meeting/dto/meeting.dto';
import { GroupyRepository } from './groupy.repository';
import { GroupyGateway } from './groupy.gateway';
import { GROUPY_STICKERS, getGroupyStickerById } from './data/stickers.data';
import {
  SendGroupyMessageDto,
  CreatePollDto,
} from './dto/groupy.dto';

interface CurrentUser {
  id: string;
  org_id?: string;
  role?: string;
  email?: string;
}

@Injectable()
export class GroupyService {
  constructor(
    private readonly groupyRepo: GroupyRepository,
    private readonly gateway: GroupyGateway,
    private readonly db: DatabaseService,
    private readonly meetingService: MeetingService,
  ) {}

  // ── Membership helper (used by every endpoint AND gateway event) ──────────

  isClassMember(accountId: string, classId: string, orgId: string) {
    return this.groupyRepo.isClassMember(accountId, classId, orgId);
  }

  private async assertMember(
    accountId: string,
    classId: string,
    orgId: string,
  ) {
    const isMember = await this.isClassMember(accountId, classId, orgId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this class chat.');
    }
  }

  // ── GET /groupy/:classId/messages ─────────────────────────────────────────

  async listMessages(
    classId: string,
    orgId: string,
    accountId: string,
    cursor?: string,
    limit?: number,
  ) {
    await this.assertMember(accountId, classId, orgId);

    const l = limit ?? 50;
    let cursorDate: Date | undefined;
    if (cursor) {
      const c = await this.groupyRepo.findMessageById(cursor, orgId);
      if (!c || c.class_id !== classId) {
        throw new BadRequestException('Invalid cursor.');
      }
      cursorDate = c.created_at;
    }

    const messages = await this.groupyRepo.findMessages({
      classId,
      orgId,
      cursorDate,
      limit: l,
    });

    return {
      messages,
      nextCursor:
        messages.length === l ? messages[messages.length - 1].id : null,
      hasMore: messages.length === l,
    };
  }

  // ── POST /groupy/:classId/messages ────────────────────────────────────────

  async sendMessage(
    classId: string,
    orgId: string,
    user: CurrentUser,
    dto: SendGroupyMessageDto,
  ) {
    await this.assertMember(user.id, classId, orgId);

    const account = await this.db.account.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });
    const senderName = account?.profile?.full_name ?? user.email ?? 'Unknown';
    const senderProfileImage = account?.profile?.profile_image ?? null;
    const senderRole = (user.role ?? 'student') as any;

    const type = dto.type ?? 'text';

    // Type-specific validation.
    let body: string | undefined;
    let gifUrl: string | undefined;
    let stickerId: string | undefined;
    if (type === 'text') {
      if (!dto.body) throw new BadRequestException('Message body is required.');
      body = dto.body;
    } else if (type === 'gif') {
      if (!dto.gifUrl) {
        throw new BadRequestException('gifUrl is required for GIF messages.');
      }
      gifUrl = dto.gifUrl;
    } else if (type === 'sticker') {
      if (!dto.stickerId) {
        throw new BadRequestException('stickerId is required for sticker messages.');
      }
      if (!getGroupyStickerById(dto.stickerId)) {
        throw new BadRequestException('Unknown sticker.');
      }
      stickerId = dto.stickerId;
    } else {
      throw new BadRequestException('Unsupported message type.');
    }

    const message = await this.groupyRepo.createMessage({
      orgId,
      classId,
      senderAccountId: user.id,
      senderRole,
      senderName,
      senderProfileImage,
      type,
      body,
      gifUrl,
      stickerId,
    });

    this.gateway.emitMessageNew(message);
    return message;
  }

  getStickers() {
    return GROUPY_STICKERS;
  }

  // ── Start Meeting ───────────────────────────────────────────────────────────

  async startMeeting(classId: string, orgId: string, user: CurrentUser) {
    const cls = await this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
      select: { educator_id: true },
    });
    if (!cls) throw new NotFoundException('Class not found.');

    // Educator only — students cannot start a meeting.
    if (cls.educator_id !== user.id) {
      throw new ForbiddenException('Only the educator can start a meeting.');
    }

    const account = await this.db.account.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });
    const senderName = account?.profile?.full_name ?? user.email ?? 'Unknown';
    const senderProfileImage = account?.profile?.profile_image ?? null;

    // Reuse the existing meeting creation path. An empty invitedStudentIds
    // array makes MeetingService auto-invite the class's active roster.
    const dto: CreateMeetingDto = {
      title: 'Class Meeting',
      startTime: new Date().toISOString(),
    };
    const meeting = await this.meetingService.create(classId, orgId, user.id, dto);
    if (!meeting) {
      throw new NotFoundException('Could not create the meeting.');
    }

    // Announce it as a system message on the Groupy stream. The body carries a
    // JSON payload so the frontend can render a "Join" button from meetingId.
    const message = await this.groupyRepo.createMessage({
      orgId,
      classId,
      senderAccountId: user.id,
      senderRole: (user.role ?? 'educator') as any,
      senderName,
      senderProfileImage,
      type: 'system',
      body: JSON.stringify({ meetingId: meeting.id, title: meeting.title }),
    });

    this.gateway.emitMessageNew(message);

    return { meetingId: meeting.id, message };
  }

  // ── DELETE /groupy/messages/:id ───────────────────────────────────────────

  async deleteMessage(messageId: string, orgId: string, accountId: string) {
    const message = await this.groupyRepo.findMessageById(messageId, orgId);
    if (!message) throw new NotFoundException('Message not found.');

    await this.assertMember(accountId, message.class_id, orgId);

    if (message.sender_account_id !== accountId) {
      throw new ForbiddenException('You can only delete your own messages.');
    }

    await this.groupyRepo.deleteMessage(messageId);
    this.gateway.emitMessageDeleted({ id: message.id, class_id: message.class_id });
    return { success: true };
  }

  // ── Reactions ───────────────────────────────────────────────────────────────

  async setReaction(
    messageId: string,
    orgId: string,
    accountId: string,
    reactionType: any,
  ) {
    const message = await this.groupyRepo.findMessageById(messageId, orgId);
    if (!message) throw new NotFoundException('Message not found.');

    await this.assertMember(accountId, message.class_id, orgId);

    await this.groupyRepo.upsertReaction({
      orgId,
      messageId,
      accountId,
      reactionType,
    });

    this.gateway.emitReactionUpdated({
      classId: message.class_id,
      messageId,
      accountId,
      reactionType,
    });

    return { success: true };
  }

  async removeReaction(messageId: string, orgId: string, accountId: string) {
    const message = await this.groupyRepo.findMessageById(messageId, orgId);
    if (!message) throw new NotFoundException('Message not found.');

    await this.assertMember(accountId, message.class_id, orgId);

    // No-op if the caller had no reaction.
    await this.groupyRepo.deleteReaction(messageId, accountId);
    this.gateway.emitReactionRemoved({
      classId: message.class_id,
      messageId,
      accountId,
    });

    return { success: true };
  }

  // ── Polls ───────────────────────────────────────────────────────────────────

  async createPoll(
    classId: string,
    orgId: string,
    user: CurrentUser,
    dto: CreatePollDto,
  ) {
    const cls = await this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
      select: { educator_id: true },
    });
    if (!cls) throw new NotFoundException('Class not found.');

    // Educator only — students cannot create polls.
    if (cls.educator_id !== user.id) {
      throw new ForbiddenException('Only the educator can create polls.');
    }

    const account = await this.db.account.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });
    const senderName = account?.profile?.full_name ?? user.email ?? 'Unknown';

    const message = await this.groupyRepo.createPoll({
      orgId,
      classId,
      createdBy: user.id,
      senderRole: (user.role ?? 'educator') as any,
      senderName,
      question: dto.question,
      options: dto.options,
    });

    // Ride on the normal new-message stream.
    this.gateway.emitMessageNew(message);
    return message;
  }

  async vote(pollId: string, orgId: string, accountId: string, optionId: string) {
    const poll = await this.groupyRepo.findPollById(pollId, orgId);
    if (!poll) throw new NotFoundException('Poll not found.');

    await this.assertMember(accountId, poll.class_id, orgId);

    // Compute effective closed state at request time.
    const isClosed =
      poll.is_closed ||
      (poll.closes_at !== null && poll.closes_at.getTime() < Date.now());
    if (isClosed) {
      throw new BadRequestException('This poll is closed.');
    }

    const option = poll.options.find((o) => o.id === optionId);
    if (!option) throw new BadRequestException('Invalid option.');

    await this.groupyRepo.upsertVote({ pollId, optionId, accountId });

    const summary = await this.buildPollResults(pollId);
    this.gateway.emitPollVoteUpdated({
      classId: poll.class_id,
      pollId,
      resultsSummary: summary,
    });

    return summary;
  }

  async closePoll(pollId: string, orgId: string, accountId: string) {
    const poll = await this.groupyRepo.findPollById(pollId, orgId);
    if (!poll) throw new NotFoundException('Poll not found.');

    // Poll creator (educator) only.
    if (poll.created_by !== accountId) {
      throw new ForbiddenException('Only the poll creator can close it.');
    }

    await this.groupyRepo.closePoll(pollId);
    this.gateway.emitPollClosed({ classId: poll.class_id, pollId });

    return { success: true };
  }

  async getPollResults(pollId: string, orgId: string, accountId: string) {
    const poll = await this.groupyRepo.findPollById(pollId, orgId);
    if (!poll) throw new NotFoundException('Poll not found.');

    await this.assertMember(accountId, poll.class_id, orgId);

    return this.buildPollResults(pollId);
  }

  async getPollDetail(pollId: string, orgId: string, accountId: string) {
    const poll = await this.groupyRepo.findPollById(pollId, orgId);
    if (!poll) throw new NotFoundException('Poll not found.');

    await this.assertMember(accountId, poll.class_id, orgId);

    const counts = await this.groupyRepo.getPollResults(pollId);
    const myVote = await this.groupyRepo.findVote(pollId, accountId);
    const isEffectiveClosed =
      poll.is_closed ||
      (poll.closes_at !== null && poll.closes_at.getTime() < Date.now());
    const totalVotes = counts.reduce((sum, o) => sum + o._count.votes, 0);

    return {
      id: poll.id,
      class_id: poll.class_id,
      question: poll.question,
      closes_at: poll.closes_at,
      is_closed: poll.is_closed,
      isClosed: isEffectiveClosed,
      created_by: poll.created_by,
      totalVotes,
      options: counts.map((o) => ({
        id: o.id,
        label: o.label,
        order_index: o.order_index,
        voteCount: o._count.votes,
      })),
      myVoteOptionId: myVote?.option_id ?? null,
    };
  }

  private async buildPollResults(pollId: string) {
    const options = await this.groupyRepo.getPollResults(pollId);
    const totalVotes = options.reduce((sum, o) => sum + o._count.votes, 0);
    return {
      options: options.map((o) => ({
        id: o.id,
        label: o.label,
        votes: o._count.votes,
      })),
      totalVotes,
    };
  }
}