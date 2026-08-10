import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { GroupyMessageType, GroupyReactionType, Role } from '@prisma/client';

@Injectable()
export class GroupyRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Membership ──────────────────────────────────────────────────────────────
  // Live membership derived from Class.educator_id + active Enrollment rows.
  async isClassMember(
    accountId: string,
    classId: string,
    orgId: string,
  ): Promise<boolean> {
    const cls = await this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
      select: { educator_id: true },
    });
    if (!cls) return false;
    if (cls.educator_id === accountId) return true;

    const enrollment = await this.db.enrollment.findFirst({
      where: {
        class_id: classId,
        org_id: orgId,
        student_id: accountId,
        status: 'active',
      },
    });
    return !!enrollment;
  }

  // ── Messages ────────────────────────────────────────────────────────────────

  async createMessage(data: {
    orgId: string;
    classId: string;
    senderAccountId: string;
    senderRole: Role;
    senderName: string;
    type: GroupyMessageType;
    body?: string;
    gifUrl?: string;
    stickerId?: string;
    pollId?: string;
  }) {
    return this.db.groupyMessage.create({
      data: {
        org_id: data.orgId,
        class_id: data.classId,
        sender_account_id: data.senderAccountId,
        sender_role: data.senderRole,
        sender_name: data.senderName,
        type: data.type,
        body: data.body ?? null,
        gif_url: data.gifUrl ?? null,
        sticker_id: data.stickerId ?? null,
        poll_id: data.pollId ?? null,
      },
      include: { reactions: true },
    });
  }

  async findMessages(args: {
    classId: string;
    orgId: string;
    cursorDate?: Date;
    limit: number;
  }) {
    return this.db.groupyMessage.findMany({
      where: {
        class_id: args.classId,
        org_id: args.orgId,
        ...(args.cursorDate
          ? { created_at: { lt: args.cursorDate } }
          : {}),
      },
      orderBy: { created_at: 'desc' },
      take: args.limit,
      include: { reactions: true },
    });
  }

  async findMessageById(id: string, orgId: string) {
    return this.db.groupyMessage.findFirst({
      where: { id, org_id: orgId },
      include: { reactions: true },
    });
  }

  async deleteMessage(id: string) {
    return this.db.groupyMessage.delete({ where: { id } });
  }

  // ── Reactions ───────────────────────────────────────────────────────────────

  async upsertReaction(args: {
    orgId: string;
    messageId: string;
    accountId: string;
    reactionType: GroupyReactionType;
  }) {
    return this.db.groupyReaction.upsert({
      where: {
        message_id_account_id: {
          message_id: args.messageId,
          account_id: args.accountId,
        },
      },
      create: {
        org_id: args.orgId,
        message_id: args.messageId,
        account_id: args.accountId,
        reaction_type: args.reactionType,
      },
      update: { reaction_type: args.reactionType },
    });
  }

  async deleteReaction(messageId: string, accountId: string) {
    return this.db.groupyReaction.deleteMany({
      where: { message_id: messageId, account_id: accountId },
    });
  }

  // ── Polls ───────────────────────────────────────────────────────────────────

  async createPoll(args: {
    orgId: string;
    classId: string;
    createdBy: string;
    senderRole: Role;
    senderName: string;
    question: string;
    options: string[];
  }) {
    return this.db.$transaction(async (tx) => {
      const poll = await tx.groupyPoll.create({
        data: {
          org_id: args.orgId,
          class_id: args.classId,
          created_by: args.createdBy,
          question: args.question,
          is_closed: false,
        },
      });

      await tx.groupyPollOption.createMany({
        data: args.options.map((label, i) => ({
          poll_id: poll.id,
          label,
          order_index: i,
        })),
      });

      return tx.groupyMessage.create({
        data: {
          org_id: args.orgId,
          class_id: args.classId,
          sender_account_id: args.createdBy,
          sender_role: args.senderRole,
          sender_name: args.senderName,
          type: 'poll',
          body: null,
          poll_id: poll.id,
        },
        include: { reactions: true },
      });
    });
  }

  async findPollById(pollId: string, orgId: string) {
    return this.db.groupyPoll.findFirst({
      where: { id: pollId, org_id: orgId },
      include: {
        options: { orderBy: { order_index: 'asc' } },
      },
    });
  }

  async findVote(pollId: string, accountId: string) {
    return this.db.groupyPollVote.findFirst({
      where: { poll_id: pollId, account_id: accountId },
    });
  }

  async upsertVote(args: {
    pollId: string;
    optionId: string;
    accountId: string;
  }) {
    return this.db.groupyPollVote.upsert({
      where: {
        poll_id_account_id: {
          poll_id: args.pollId,
          account_id: args.accountId,
        },
      },
      create: {
        poll_id: args.pollId,
        option_id: args.optionId,
        account_id: args.accountId,
      },
      update: { option_id: args.optionId },
    });
  }

  async getPollResults(pollId: string) {
    return this.db.groupyPollOption.findMany({
      where: { poll_id: pollId },
      orderBy: { order_index: 'asc' },
      include: { _count: { select: { votes: true } } },
    });
  }

  async closePoll(pollId: string) {
    return this.db.groupyPoll.update({
      where: { id: pollId },
      data: { is_closed: true },
    });
  }
}