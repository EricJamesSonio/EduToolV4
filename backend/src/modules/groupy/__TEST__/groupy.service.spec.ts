import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { GroupyService } from '../groupy.service';

describe('GroupyService', () => {
  let service: GroupyService;
  let repo: any;
  let gateway: any;
  let db: any;
  let meetingService: any;
  const orgId = 'org-1';
  const classId = 'class-1';
  const accountId = 'acc-1';

  beforeEach(() => {
    repo = {
      isClassMember: jest.fn(),
      findMessageById: jest.fn(),
      findMessages: jest.fn(),
      createMessage: jest.fn(),
      deleteMessage: jest.fn(),
      upsertReaction: jest.fn(),
      deleteReaction: jest.fn(),
      createPoll: jest.fn(),
      findPollById: jest.fn(),
      upsertVote: jest.fn(),
      getPollResults: jest.fn(),
      closePoll: jest.fn(),
      findVote: jest.fn(),
      findActiveMeeting: jest.fn(),
      upsertReadReceipt: jest.fn(),
      getReadReceipt: jest.fn(),
      listMembers: jest.fn(),
    };
    gateway = {
      emitMessageNew: jest.fn(),
      emitMessageDeleted: jest.fn(),
      emitReactionUpdated: jest.fn(),
      emitReactionRemoved: jest.fn(),
      emitPollVoteUpdated: jest.fn(),
      emitPollClosed: jest.fn(),
      emitReadUpdated: jest.fn(),
    };
    db = {
      account: { findUnique: jest.fn() },
      class: { findFirst: jest.fn() },
    };
    meetingService = { create: jest.fn() };
    service = new GroupyService(repo, gateway, db, meetingService);
    jest.clearAllMocks();
  });

  describe('isClassMember / assertMember', () => {
    it('listMessages throws BadRequest when cursor invalid', async () => {
      repo.isClassMember.mockResolvedValue(true);
      repo.findMessageById.mockResolvedValue(null);
      await expect(service.listMessages(classId, orgId, accountId, 'bad-cursor', 10)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('listMessages throws Forbidden when not member', async () => {
      repo.isClassMember.mockResolvedValue(false);
      await expect(service.listMessages(classId, orgId, accountId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('listMessages returns paginated', async () => {
      repo.isClassMember.mockResolvedValue(true);
      repo.findMessages.mockResolvedValue([{ id: 'msg-1' }, { id: 'msg-2' }]);
      const res = await service.listMessages(classId, orgId, accountId, undefined, 2);
      expect(res.messages).toHaveLength(2);
      expect(res.hasMore).toBe(true);
      expect(res.nextCursor).toBe('msg-2');
    });
  });

  describe('sendMessage', () => {
    it('throws Forbidden when not member', async () => {
      repo.isClassMember.mockResolvedValue(false);
      await expect(service.sendMessage(classId, orgId, { id: accountId } as any, { type: 'text', body: 'hi' } as any)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('throws when text body missing', async () => {
      repo.isClassMember.mockResolvedValue(true);
      db.account.findUnique.mockResolvedValue({ profile: { full_name: 'John' } });
      await expect(service.sendMessage(classId, orgId, { id: accountId, email: 'a@b.com' } as any, { type: 'text' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws when gifUrl missing', async () => {
      repo.isClassMember.mockResolvedValue(true);
      db.account.findUnique.mockResolvedValue({ profile: { full_name: 'John' } });
      await expect(service.sendMessage(classId, orgId, { id: accountId } as any, { type: 'gif' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws for unknown sticker', async () => {
      repo.isClassMember.mockResolvedValue(true);
      db.account.findUnique.mockResolvedValue({ profile: { full_name: 'John' } });
      await expect(service.sendMessage(classId, orgId, { id: accountId } as any, { type: 'sticker', stickerId: 'unknown' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('creates text message and emits', async () => {
      repo.isClassMember.mockResolvedValue(true);
      db.account.findUnique.mockResolvedValue({ profile: { full_name: 'John', profile_image: 'img.png' } });
      repo.createMessage.mockResolvedValue({ id: 'msg-1', body: 'hi' });
      const res = await service.sendMessage(classId, orgId, { id: accountId, email: 'a@b.com', role: 'student' } as any, { type: 'text', body: 'hi' } as any);
      expect(repo.createMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'text', body: 'hi', senderName: 'John' }));
      expect(gateway.emitMessageNew).toHaveBeenCalledWith({ id: 'msg-1', body: 'hi' });
      expect(res.id).toBe('msg-1');
    });
  });

  describe('deleteMessage', () => {
    it('throws NotFound when message missing', async () => {
      repo.findMessageById.mockResolvedValue(null);
      await expect(service.deleteMessage('nope', orgId, accountId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Forbidden when not member', async () => {
      repo.findMessageById.mockResolvedValue({ id: 'msg-1', class_id: classId, sender_account_id: accountId });
      repo.isClassMember.mockResolvedValue(false);
      await expect(service.deleteMessage('msg-1', orgId, accountId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('throws Forbidden when not owner', async () => {
      repo.findMessageById.mockResolvedValue({ id: 'msg-1', class_id: classId, sender_account_id: 'other' });
      repo.isClassMember.mockResolvedValue(true);
      await expect(service.deleteMessage('msg-1', orgId, accountId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('deletes and emits', async () => {
      repo.findMessageById.mockResolvedValue({ id: 'msg-1', class_id: classId, sender_account_id: accountId });
      repo.isClassMember.mockResolvedValue(true);
      const res = await service.deleteMessage('msg-1', orgId, accountId);
      expect(repo.deleteMessage).toHaveBeenCalledWith('msg-1');
      expect(gateway.emitMessageDeleted).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });

  describe('reactions', () => {
    it('setReaction throws NotFound', async () => {
      repo.findMessageById.mockResolvedValue(null);
      await expect(service.setReaction('nope', orgId, accountId, 'like')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('setReaction succeeds', async () => {
      repo.findMessageById.mockResolvedValue({ id: 'msg-1', class_id: classId });
      repo.isClassMember.mockResolvedValue(true);
      const res = await service.setReaction('msg-1', orgId, accountId, 'like');
      expect(repo.upsertReaction).toHaveBeenCalled();
      expect(gateway.emitReactionUpdated).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });
  });

  describe('startMeeting', () => {
    it('throws NotFound when class missing', async () => {
      db.class.findFirst.mockResolvedValue(null);
      await expect(service.startMeeting(classId, orgId, { id: accountId } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Forbidden when not educator', async () => {
      db.class.findFirst.mockResolvedValue({ educator_id: 'other' });
      await expect(service.startMeeting(classId, orgId, { id: accountId } as any)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('creates ephemeral meeting and system message', async () => {
      db.class.findFirst.mockResolvedValue({ educator_id: accountId });
      db.account.findUnique.mockResolvedValue({ profile: { full_name: 'Prof' } });
      meetingService.create.mockResolvedValue({ id: 'meet-1', title: 'Class Meeting' });
      repo.createMessage.mockResolvedValue({ id: 'msg-1' });
      const res = await service.startMeeting(classId, orgId, { id: accountId, role: 'educator', email: 'e@b.com' } as any);
      expect(meetingService.create).toHaveBeenCalledWith(classId, orgId, accountId, expect.objectContaining({ ephemeral: true }));
      expect(repo.createMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'system' }));
      expect(res.meetingId).toBe('meet-1');
    });
  });

  describe('polls', () => {
    it('createPoll throws Forbidden when not educator', async () => {
      db.class.findFirst.mockResolvedValue({ educator_id: 'other' });
      await expect(service.createPoll(classId, orgId, { id: accountId } as any, { question: 'Q?', options: ['A', 'B'] } as any)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('vote throws when poll closed', async () => {
      repo.findPollById.mockResolvedValue({ id: 'poll-1', class_id: classId, is_closed: true, closes_at: null, options: [] });
      repo.isClassMember.mockResolvedValue(true);
      await expect(service.vote('poll-1', orgId, accountId, 'opt-1')).rejects.toBeInstanceOf(BadRequestException);
    });
    it('vote succeeds', async () => {
      repo.findPollById.mockResolvedValue({ id: 'poll-1', class_id: classId, is_closed: false, closes_at: null, options: [{ id: 'opt-1' }] });
      repo.isClassMember.mockResolvedValue(true);
      repo.upsertVote.mockResolvedValue({});
      repo.getPollResults.mockResolvedValue([{ id: 'opt-1', label: 'A', _count: { votes: 1 } }]);
      const res = await service.vote('poll-1', orgId, accountId, 'opt-1');
      expect(repo.upsertVote).toHaveBeenCalled();
      expect(res.totalVotes).toBe(1);
    });
  });

  describe('read receipts / unread', () => {
    it('reportRead throws BadRequest when message not in class', async () => {
      repo.isClassMember.mockResolvedValue(true);
      repo.findMessageById.mockResolvedValue({ id: 'msg-1', class_id: 'other-class' });
      await expect(service.reportRead(classId, orgId, accountId, 'msg-1')).rejects.toBeInstanceOf(BadRequestException);
    });
    it('getUnreadStatus returns hasUnread false when no messages', async () => {
      repo.isClassMember.mockResolvedValue(true);
      repo.findMessages.mockResolvedValue([]);
      repo.getReadReceipt.mockResolvedValue(null);
      const res = await service.getUnreadStatus(classId, orgId, accountId);
      expect(res.hasUnread).toBe(false);
    });
  });
});
