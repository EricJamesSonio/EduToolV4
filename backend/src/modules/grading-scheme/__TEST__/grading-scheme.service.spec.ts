import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GradingSchemeService } from '../grading-scheme.service';

describe('GradingSchemeService', () => {
  let service: GradingSchemeService;
  let repo: any;
  let templateService: any;
  let db: any;
  let gradeRefresh: any;
  const orgId = 'org-1';
  const classId = 'class-1';

  const validComponents = [
    { name: 'Quiz', type: 'quiz', weight: 40, maxScore: 100, isOptional: false },
    { name: 'Exam', type: 'exam', weight: 60, maxScore: 100, isOptional: false },
  ];

  beforeEach(() => {
    repo = {
      findByClassId: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      upsertForClass: jest.fn(),
      findClassIdsByProgram: jest.fn(),
      lockByClassId: jest.fn(),
    };
    templateService = { findById: jest.fn() };
    db = { assessment: { findMany: jest.fn().mockResolvedValue([]) } };
    gradeRefresh = { refreshClassGrades: jest.fn().mockResolvedValue({ computed: 0, skippedLocked: 0, terms: 0 }) };
    service = new GradingSchemeService(repo, templateService, db, gradeRefresh);
    jest.clearAllMocks();
  });

  describe('validateWeights', () => {
    it('throws when empty', async () => {
      await expect(service.create(orgId, { classId, name: 'T', components: [] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws when required sum !=100', async () => {
      repo.findByClassId.mockResolvedValue(null);
      await expect(service.create(orgId, { classId, name: 'T', components: [{ name: 'A', type: 'a', weight: 50, isOptional: false }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('ignores optional components in sum', async () => {
      repo.findByClassId.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'gs-1' });
      const comps = [
        { name: 'Quiz', type: 'quiz', weight: 100, isOptional: false },
        { name: 'Bonus', type: 'bonus', weight: 50, isOptional: true },
      ];
      await expect(service.create(orgId, { classId, name: 'T', components: comps } as any)).resolves.toBeDefined();
      expect(repo.create).toHaveBeenCalled();
    });
  });

  describe('create / update', () => {
    it('create throws when already exists', async () => {
      repo.findByClassId.mockResolvedValue({ id: 'existing' });
      await expect(service.create(orgId, { classId, name: 'T', components: validComponents } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('create succeeds', async () => {
      repo.findByClassId.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'gs-1', name: 'T' });
      const res = await service.create(orgId, { classId, name: 'T', components: validComponents } as any);
      expect(repo.create).toHaveBeenCalledWith(orgId, classId, undefined, 'T', validComponents);
      expect(res.id).toBe('gs-1');
    });
    it('update throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', orgId, {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('update succeeds even when locked (free edit)', async () => {
      repo.findById.mockResolvedValue({ id: 'gs-1', classId, isLocked: true });
      repo.update.mockResolvedValue({ id: 'gs-1', name: 'Updated' });
      const res = await service.update('gs-1', orgId, { name: 'Updated' } as any);
      expect(res.name).toBe('Updated');
    });
    it('update blocks removal of a type used by existing assessments', async () => {
      repo.findById.mockResolvedValue({ id: 'gs-1', classId, isLocked: false });
      db.assessment.findMany.mockResolvedValue([{ type: 'quiz' }, { type: 'exam' }]);
      const examOnly = [{ name: 'Exam', type: 'exam', weight: 100, isOptional: false }];
      await expect(service.update('gs-1', orgId, { components: examOnly } as any)).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });
    it('update refreshes grades after a component change', async () => {
      repo.findById.mockResolvedValue({ id: 'gs-1', classId, isLocked: false });
      db.assessment.findMany.mockResolvedValue([]);
      repo.update.mockResolvedValue({ id: 'gs-1', name: 'Updated' });
      await service.update('gs-1', orgId, { name: 'Updated', components: validComponents } as any, 'actor-1');
      expect(gradeRefresh.refreshClassGrades).toHaveBeenCalledWith(orgId, classId, 'actor-1', 'grading_scheme_updated');
    });
    it('update validates weights when provided', async () => {
      repo.findById.mockResolvedValue({ id: 'gs-1', isLocked: false });
      await expect(service.update('gs-1', orgId, { components: [] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('update succeeds', async () => {
      repo.findById.mockResolvedValue({ id: 'gs-1', isLocked: false });
      repo.update.mockResolvedValue({ id: 'gs-1', name: 'Updated' });
      const res = await service.update('gs-1', orgId, { name: 'Updated', components: validComponents } as any);
      expect(repo.update).toHaveBeenCalled();
      expect(res.name).toBe('Updated');
    });
  });

  describe('findByClass / getAllowedAssessmentTypes', () => {
    it('findByClass delegates', async () => {
      repo.findByClassId.mockResolvedValue({ id: 'gs-1' });
      expect(await service.findByClass(classId, orgId)).toEqual({ id: 'gs-1' });
    });
    it('getAllowedAssessmentTypes returns [] when no scheme', async () => {
      repo.findByClassId.mockResolvedValue(null);
      expect(await service.getAllowedAssessmentTypes(classId, orgId)).toEqual([]);
    });
    it('getAllowedAssessmentTypes returns types', async () => {
      repo.findByClassId.mockResolvedValue({ components: [{ type: 'quiz' }, { type: 'exam' }] });
      expect(await service.getAllowedAssessmentTypes(classId, orgId)).toEqual(['quiz', 'exam']);
    });
  });

  describe('applyTemplateToClass', () => {
    it('applies with mapped components', async () => {
      templateService.findById.mockResolvedValue({ id: 'tmpl-1', name: 'Tpl', components: validComponents });
      repo.upsertForClass.mockResolvedValue({ id: 'gs-1' });
      const res = await service.applyTemplateToClass(orgId, { classId, templateId: 'tmpl-1' } as any);
      expect(repo.upsertForClass).toHaveBeenCalledWith(orgId, classId, 'tmpl-1', 'Tpl', expect.any(Array));
      if (!res) throw new Error('expected res to be defined');
      expect(res.id).toBe('gs-1');
    });
  });

  describe('applyTemplateToProgram', () => {
    it('throws when no classes', async () => {
      templateService.findById.mockResolvedValue({ id: 'tmpl-1', name: 'Tpl', components: validComponents });
      repo.findClassIdsByProgram.mockResolvedValue([]);
      await expect(service.applyTemplateToProgram(orgId, { programId: 'prog-1', templateId: 'tmpl-1' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('applies to each class and reports applied/skipped', async () => {
      templateService.findById.mockResolvedValue({ id: 'tmpl-1', name: 'Tpl', components: validComponents });
      repo.findClassIdsByProgram.mockResolvedValue(['c1', 'c2', 'c3']);
      repo.upsertForClass
        .mockResolvedValueOnce({ id: 'gs-1' })
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ id: 'gs-3' });
      const res = await service.applyTemplateToProgram(orgId, { programId: 'prog-1', templateId: 'tmpl-1' } as any);
      expect(res).toEqual({ applied: 2, skipped: 1, total: 3 });
      expect(repo.upsertForClass).toHaveBeenCalledTimes(3);
    });
  });

  describe('lockForClass', () => {
    it('delegates', async () => {
      repo.lockByClassId.mockResolvedValue({ id: 'gs-1' });
      expect(await service.lockForClass(classId)).toEqual({ id: 'gs-1' });
    });
  });
});
