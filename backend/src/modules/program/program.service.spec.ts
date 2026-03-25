import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProgramService } from './program.service';
import { ProgramRepository } from './program.repository';
import { ProgramType } from './dto/program.dto';

const mockRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNameAndOrg: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  hasLevels: jest.fn(),
};

const ORG_ID = 'org-1';
const PROGRAM_ID = 'prog-1';

const mockProgram = {
  id: PROGRAM_ID,
  org_id: ORG_ID,
  name: 'BSCS',
  type: ProgramType.COLLEGE,
};

describe('ProgramService', () => {
  let service: ProgramService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        { provide: ProgramRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ProgramService>(ProgramService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates and returns a program', async () => {
      mockRepo.findByNameAndOrg.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockProgram);

      const result = await service.create(ORG_ID, {
        name: 'BSCS',
        type: ProgramType.COLLEGE,
      });

      expect(result).toEqual(mockProgram);
      expect(mockRepo.create).toHaveBeenCalledWith({
        orgId: ORG_ID,
        name: 'BSCS',
        type: ProgramType.COLLEGE,
      });
    });

    it('throws ConflictException if name is taken', async () => {
      mockRepo.findByNameAndOrg.mockResolvedValue(mockProgram);

      await expect(
        service.create(ORG_ID, { name: 'BSCS', type: ProgramType.COLLEGE }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('returns list of programs', async () => {
      mockRepo.findAll.mockResolvedValue([mockProgram]);
      const result = await service.findAll(ORG_ID);
      expect(result).toEqual([mockProgram]);
    });
  });

  // ── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('returns program when found', async () => {
      mockRepo.findById.mockResolvedValue(mockProgram);
      const result = await service.findById(PROGRAM_ID, ORG_ID);
      expect(result).toEqual(mockProgram);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById('bad', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('updates program successfully', async () => {
      const updated = { ...mockProgram, name: 'BSIT' };
      mockRepo.findById.mockResolvedValue(mockProgram);
      mockRepo.findByNameAndOrg.mockResolvedValue(null);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update(PROGRAM_ID, ORG_ID, { name: 'BSIT' });
      expect(result.name).toBe('BSIT');
    });

    it('throws ConflictException if new name is taken', async () => {
      mockRepo.findById.mockResolvedValue(mockProgram);
      mockRepo.findByNameAndOrg.mockResolvedValue({ id: 'other', name: 'BSIT' });

      await expect(
        service.update(PROGRAM_ID, ORG_ID, { name: 'BSIT' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException for unknown program', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.update('bad', ORG_ID, { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('deletes program successfully', async () => {
      mockRepo.findById.mockResolvedValue(mockProgram);
      mockRepo.hasLevels.mockResolvedValue(false);
      mockRepo.delete.mockResolvedValue(mockProgram);

      await expect(service.remove(PROGRAM_ID, ORG_ID)).resolves.not.toThrow();
    });

    it('throws ConflictException if levels are linked', async () => {
      mockRepo.findById.mockResolvedValue(mockProgram);
      mockRepo.hasLevels.mockResolvedValue(true);

      await expect(service.remove(PROGRAM_ID, ORG_ID)).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException for unknown program', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.remove('bad', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });
});