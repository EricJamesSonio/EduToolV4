import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  SetEducatorSubjectsDto,
  EducatorSubjectUsageQueryDto,
} from '../dto/educator.dto';

// Seeded rows use deterministic UUIDv5 ids; admin-created rows use v4.
// Both must pass validation — the schema id is a plain String either way.
const V4 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const V5 = 'a0eebc99-9c0b-5ef8-bb6d-6bb9bd380a11';

describe('educator DTO id versions', () => {
  it('accepts v4 and seeded v5 subject ids', async () => {
    const dto = plainToInstance(SetEducatorSubjectsDto, {
      subjectIds: [V4, V5],
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('still rejects non-UUID subject ids', async () => {
    const dto = plainToInstance(SetEducatorSubjectsDto, {
      subjectIds: ['MATH-101'],
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('accepts a school year id in the subject usage query', async () => {
    const dto = plainToInstance(EducatorSubjectUsageQueryDto, {
      schoolYearId: V4,
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});
