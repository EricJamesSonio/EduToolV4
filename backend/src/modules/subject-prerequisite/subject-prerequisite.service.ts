import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'; // ✅ added semicolon

import { SubjectPrerequisiteRepository } from './subject-prerequisite.repository';
import {
  CreatePrerequisiteDto,
  BulkCreatePrerequisiteDto,
  PrerequisiteCheckResultDto,
} from './dto/subject-prerequisite.dto';

// Minimum passing grade — adjust to match your org's grading scale
const PASSING_SCORE = 75;

@Injectable()
export class SubjectPrerequisiteService {
  constructor(
    private readonly prereqRepository: SubjectPrerequisiteRepository,
  ) {}

  async create(orgId: string, dto: CreatePrerequisiteDto) {
    if (dto.subject_id === dto.prerequisite_id) {
      throw new BadRequestException(
        'A subject cannot be a prerequisite of itself',
      );
    }

    const existing = await this.prereqRepository.findOne(
      dto.subject_id,
      dto.prerequisite_id,
      orgId,
    );

    if (existing) {
      throw new ConflictException('This prerequisite link already exists');
    }

    return this.prereqRepository.create(orgId, dto);
  }

  async bulkCreate(orgId: string, dto: BulkCreatePrerequisiteDto) {
    if (dto.prerequisite_ids.includes(dto.subject_id)) {
      throw new BadRequestException(
        'A subject cannot be a prerequisite of itself',
      );
    }

    return this.prereqRepository.bulkCreate(
      orgId,
      dto.subject_id,
      dto.prerequisite_ids,
    );
  }

  async findBySubject(subject_id: string, org_id: string) {
    return this.prereqRepository.findBySubject(subject_id, org_id);
  }

  async remove(id: string, subject_id: string, org_id: string) {
    const existing = await this.prereqRepository.findOne(
      subject_id,
      id,
      org_id,
    );

    if (!existing) {
      throw new NotFoundException('Prerequisite link not found');
    }

    return this.prereqRepository.delete(existing.id);
  }

  async checkEligibility(
    subject_id: string,
    student_id: string,
    org_id: string,
  ): Promise<PrerequisiteCheckResultDto> {
    let rows = await this.prereqRepository.getPrerequisitesWithGrades(
      subject_id,
      student_id,
      org_id,
    );

    if (rows.length === 0) {
      const defined = await this.prereqRepository.findBySubject(
        subject_id,
        org_id,
      );

      if (defined.length > 0) {
        rows = defined.map((d) => ({
          subject_id: d.prerequisite_id,
          subject_name: (d as any).prerequisite?.name ?? d.prerequisite_id,
          grade: null,
        }));
      }
    }

    if (rows.length === 0) {
      return { eligible: true, missing: [] };
    }

    const missing: PrerequisiteCheckResultDto['missing'] = [];

    for (const row of rows) {
      if (!row.grade) {
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_taken',
        });
        continue;
      }

      if (!row.grade.is_locked) {
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_locked',
        });
        continue;
      }

      if (row.grade.final_score < PASSING_SCORE) {
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_passed',
        });
      }
    }

    return {
      eligible: missing.length === 0,
      missing,
    };
  }
}
