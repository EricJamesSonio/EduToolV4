// src/modules/program/program.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProgramRepository } from './program.repository';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';

@Injectable()
export class ProgramService {
  constructor(private readonly programRepository: ProgramRepository) {}

  // ── POST /programs ──────────────────────────────────────────────────────────

  /**
   * Creates a new program for the org.
   * Built-in types (elementary, high_school, senior_high, college) are allowed
   * to exist multiple times if the school genuinely needs them.
   * Name must be unique within the org to avoid confusion.
   */
  async create(orgId: string, dto: CreateProgramDto) {
    const nameTaken = await this.programRepository.findByNameAndOrg(
      dto.name,
      orgId,
    );

    if (nameTaken) {
      throw new ConflictException(
        `A program named "${dto.name}" already exists in this organization.`,
      );
    }

    return this.programRepository.create({
      orgId,
      name: dto.name,
      type: dto.type,
    });
  }

  // ── GET /programs ───────────────────────────────────────────────────────────

  async findAll(orgId: string) {
    return this.programRepository.findAll(orgId);
  }

  // ── GET /programs/:id ───────────────────────────────────────────────────────

  async findById(id: string, orgId: string) {
    const program = await this.programRepository.findById(id, orgId);

    if (!program) {
      throw new NotFoundException('Program not found.');
    }

    return program;
  }

  // ── PATCH /programs/:id ─────────────────────────────────────────────────────

  async update(id: string, orgId: string, dto: UpdateProgramDto) {
    const program = await this.programRepository.findById(id, orgId);

    if (!program) {
      throw new NotFoundException('Program not found.');
    }

    // Guard: new name must be unique within org
    if (dto.name && dto.name !== program.name) {
      const nameTaken = await this.programRepository.findByNameAndOrg(
        dto.name,
        orgId,
      );
      if (nameTaken) {
        throw new ConflictException(
          `A program named "${dto.name}" already exists in this organization.`,
        );
      }
    }

    return this.programRepository.update(id, {
      name: dto.name,
      type: dto.type,
    });
  }

  // ── DELETE /programs/:id ────────────────────────────────────────────────────

  /**
   * Hard deletes the program.
   * Blocked if levels are linked to this program — Admin must remove
   * or reassign those levels first.
   */
  async remove(id: string, orgId: string) {
    const program = await this.programRepository.findById(id, orgId);

    if (!program) {
      throw new NotFoundException('Program not found.');
    }

    const hasLevels = await this.programRepository.hasLevels(id);
    if (hasLevels) {
      throw new ConflictException(
        'Cannot delete a program that has levels assigned to it. ' +
          'Remove or reassign those levels first.',
      );
    }

    return this.programRepository.delete(id);
  }
}