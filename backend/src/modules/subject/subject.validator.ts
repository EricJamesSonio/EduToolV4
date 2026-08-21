// filepath: backend/src/modules/subject/subject.validator.ts

import { BadRequestException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/subject.dto';

export function validateSubjectScope(
  dto: CreateSubjectDto,
  programType: string,
): void {
  const type = dto.subjectType ?? 'major';

  if (type === 'major') {
    const isCourse = programType === 'college';
    const isStrand = programType === 'shs';

    if (isCourse && !dto.courseId) {
      throw new BadRequestException(
        'Major subjects under a college program require a courseId.',
      );
    }
    if (isStrand && !dto.strandId) {
      throw new BadRequestException(
        'Major subjects under a SHS program require a strandId.',
      );
    }
  }

  if (type === 'minor' && !dto.levelId) {
    throw new BadRequestException('Minor subjects must specify a levelId.');
  }
}