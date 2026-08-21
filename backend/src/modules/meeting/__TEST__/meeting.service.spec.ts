import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { MeetingService } from '../meeting.service';

describe('MeetingService', () => {
  let service: MeetingService;
  let meetingRepo: any;
  let classRepo: any;
  let enrollmentRepo: any;
  let notif: any;
  let audit: any;
  let gateway: any;
  const orgId = 'org-1';
  const classId = 'class-1';
  const educatorId = 'edu-1';
  const studentId = 'stu-1';

  beforeEach(() => {
    meetingRepo = {
      create: jest.fn(),
      createInvites: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      replaceInvites: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updateStatus: jest.fn(),
      hardDelete: jest.fn(),
      isStudentInvited: jest.fn(),
      findJoinRequest: jest.fn(),
      createJoinRequest: jest.fn(),
      findJoinRequestById: jest.fn(),
      updateJoinRequest: jest.fn(),
    };
    classRepo = { findById: jest.fn() };
    enrollmentRepo = { findByClass: jest.fn(), findOneByStudentAndClass: jest.fn() };
    notif = { createBulkNotifications: jest.fn().mockResolvedValue(undefined), createNotification: jest.fn().mockResolvedValue(undefined) };
    audit = { logActivityEvent: jest.fn().mockResolvedValue(undefined) };
    gateway = { server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) } };
    service = new MeetingService(meetingRepo, classRepo, enrollmentRepo, notif, audit, gateway);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws NotFound when class missing', async () => {
      classRepo.findById.mockResolvedValue(null);
      await expect(service.create(classId, orgId, educatorId, { title: 'M', startTime: new Date().toISOString() } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Forbidden when not owner', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: 'other' });
      await expect(service.create(classId, orgId, educatorId, { title: 'M', startTime: new Date().toISOString() } as any)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('creates with explicit invites', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      meetingRepo.create.mockResolvedValue({ id: 'meet-1', title: 'M', start_time: new Date() });
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', title: 'M' });
      const res = await service.create(classId, orgId, educatorId, { title: 'M', startTime: new Date().toISOString(), invitedStudentIds: [studentId] } as any);
      expect(meetingRepo.createInvites).toHaveBeenCalledWith(orgId, 'meet-1', [studentId]);
      expect(notif.createBulkNotifications).toHaveBeenCalled();
      expect(res.id).toBe('meet-1');
    });
    it('creates with all enrollments when no invites provided', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      meetingRepo.create.mockResolvedValue({ id: 'meet-1', title: 'M', start_time: new Date() });
      enrollmentRepo.findByClass.mockResolvedValue([{ student_id: 's1' }, { student_id: 's2' }]);
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1' });
      await service.create(classId, orgId, educatorId, { title: 'M', startTime: new Date().toISOString() } as any);
      expect(meetingRepo.createInvites).toHaveBeenCalledWith(orgId, 'meet-1', ['s1', 's2']);
    });
  });

  describe('findAll / findOne', () => {
    it('findAll throws NotFound when class missing', async () => {
      classRepo.findById.mockResolvedValue(null);
      await expect(service.findAll(classId, orgId, educatorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('findAll throws Forbidden when not owner', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: 'other' });
      await expect(service.findAll(classId, orgId, educatorId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('findOne throws NotFound when meeting class mismatch', async () => {
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', class_id: 'other-class' });
      await expect(service.findOne('meet-1', classId, orgId, educatorId)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update / remove / endMeeting', () => {
    it('update throws BadRequest when ended', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', class_id: classId, educator_id: educatorId, status: 'ended' });
      classRepo.findById.mockResolvedValue({ id: classId, educator_id: educatorId });
      // Need to mock assertEducatorOwnsMeeting via findById
      await expect(service.update('meet-1', classId, orgId, educatorId, {} as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('update replaces invites when provided', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', class_id: classId, educator_id: educatorId, status: 'scheduled' });
      meetingRepo.update.mockResolvedValue({ id: 'meet-1', title: 'New' });
      const res = await service.update('meet-1', classId, orgId, educatorId, { invitedStudentIds: [studentId] } as any);
      expect(meetingRepo.replaceInvites).toHaveBeenCalledWith(orgId, 'meet-1', [studentId]);
      expect(res.title).toBe('New');
    });
    it('remove delegates to softDelete', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', class_id: classId, educator_id: educatorId });
      await service.remove('meet-1', classId, orgId, educatorId);
      expect(meetingRepo.softDelete).toHaveBeenCalledWith('meet-1');
    });
    it('endMeeting returns already ended when NotFound (ephemeral)', async () => {
      meetingRepo.findById.mockResolvedValue(null);
      const res = await service.endMeeting('meet-1', classId, orgId, educatorId);
      expect(res).toEqual({ success: true, message: 'Meeting already ended.' });
    });
    it('endMeeting hardDeletes ephemeral', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', class_id: classId, educator_id: educatorId, status: 'scheduled', is_ephemeral: true });
      const res = await service.endMeeting('meet-1', classId, orgId, educatorId);
      expect(meetingRepo.hardDelete).toHaveBeenCalledWith('meet-1');
      expect(res.success).toBe(true);
    });
    it('endMeeting updates status and logs for normal', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', class_id: classId, educator_id: educatorId, status: 'scheduled', is_ephemeral: false });
      const res = await service.endMeeting('meet-1', classId, orgId, educatorId);
      expect(meetingRepo.updateStatus).toHaveBeenCalledWith('meet-1', 'ended');
      expect(audit.logActivityEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'meeting_ended' }));
      expect(res.success).toBe(true);
    });
    it('endMeeting returns already ended when status ended', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', class_id: classId, educator_id: educatorId, status: 'ended', is_ephemeral: false });
      const res = await service.endMeeting('meet-1', classId, orgId, educatorId);
      expect(res.message).toBe('Meeting already ended.');
    });
  });

  describe('requestJoin / respondToJoinRequest', () => {
    it('requestJoin throws NotFound when meeting missing', async () => {
      meetingRepo.findById.mockResolvedValue(null);
      await expect(service.requestJoin('nope', orgId, studentId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('requestJoin throws when already ended', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', status: 'ended' });
      await expect(service.requestJoin('meet-1', orgId, studentId)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('requestJoin throws when already invited', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', status: 'scheduled', educator_id: educatorId, title: 'M' });
      meetingRepo.isStudentInvited.mockResolvedValue(true);
      await expect(service.requestJoin('meet-1', orgId, studentId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('requestJoin throws when pending request exists', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', status: 'scheduled', educator_id: educatorId, title: 'M' });
      meetingRepo.isStudentInvited.mockResolvedValue(false);
      meetingRepo.findJoinRequest.mockResolvedValue({ id: 'req-1' });
      await expect(service.requestJoin('meet-1', orgId, studentId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('requestJoin creates and notifies', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', status: 'scheduled', educator_id: educatorId, title: 'M' });
      meetingRepo.isStudentInvited.mockResolvedValue(false);
      meetingRepo.findJoinRequest.mockResolvedValue(null);
      meetingRepo.createJoinRequest.mockResolvedValue({ id: 'req-1', student_id: studentId });
      const res = await service.requestJoin('meet-1', orgId, studentId);
      expect(meetingRepo.createJoinRequest).toHaveBeenCalledWith(orgId, 'meet-1', studentId);
      expect(notif.createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'meeting_join_request' }));
      expect(res.id).toBe('req-1');
    });
    it('respondToJoinRequest throws Forbidden when not owner', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', educator_id: 'other' });
      await expect(service.respondToJoinRequest('meet-1', 'req-1', orgId, educatorId, { status: 'accepted' } as any)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('respondToJoinRequest throws NotFound when request missing', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', educator_id: educatorId });
      meetingRepo.findJoinRequestById.mockResolvedValue(null);
      await expect(service.respondToJoinRequest('meet-1', 'req-1', orgId, educatorId, { status: 'accepted' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('respondToJoinRequest throws when already responded', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', educator_id: educatorId });
      meetingRepo.findJoinRequestById.mockResolvedValue({ id: 'req-1', meeting_id: 'meet-1', status: 'accepted', student_id: studentId });
      await expect(service.respondToJoinRequest('meet-1', 'req-1', orgId, educatorId, { status: 'accepted' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('respondToJoinRequest accepts and creates invite', async () => {
      meetingRepo.findById.mockResolvedValue({ id: 'meet-1', educator_id: educatorId, title: 'M' });
      meetingRepo.findJoinRequestById.mockResolvedValue({ id: 'req-1', meeting_id: 'meet-1', status: 'pending', student_id: studentId });
      meetingRepo.updateJoinRequest.mockResolvedValue({ id: 'req-1', status: 'accepted' });
      const res = await service.respondToJoinRequest('meet-1', 'req-1', orgId, educatorId, { status: 'accepted' } as any);
      expect(meetingRepo.createInvites).toHaveBeenCalledWith(orgId, 'meet-1', [studentId]);
      expect(notif.createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'meeting_join_accepted' }));
      expect(res.status).toBe('accepted');
    });
  });

  describe('student find', () => {
    it('findAllForStudent throws Forbidden when not enrolled', async () => {
      enrollmentRepo.findOneByStudentAndClass.mockResolvedValue(null);
      await expect(service.findAllForStudent(classId, orgId, studentId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('findAllForStudent maps isInvited', async () => {
      enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({ id: 'enr-1' });
      meetingRepo.findAll.mockResolvedValue([{ id: 'meet-1', title: 'M', start_time: new Date(), status: 'scheduled', invites: [{ student_id: studentId }], join_requests: [] }]);
      const res = await service.findAllForStudent(classId, orgId, studentId);
      expect(res[0].isInvited).toBe(true);
    });
  });
});
