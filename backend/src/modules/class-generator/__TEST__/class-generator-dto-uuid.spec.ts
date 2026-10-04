import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  GenerateClassesDto,
  GenerateReadinessDto,
} from '../dto/class-generator.dto';

// Seeded programs/sections use deterministic UUIDv5 ids; validation must
// accept them alongside admin-created v4 ids.
const V4 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const V5 = 'a0eebc99-9c0b-5ef8-bb6d-6bb9bd380a11';

describe('class-generator DTO id versions', () => {
  it('accepts v4 and seeded v5 program/section ids', async () => {
    const dto = plainToInstance(GenerateClassesDto, {
      schoolYearId: V4,
      programIds: [V5],
      semesterId: V4,
      sectionIds: [V5, V4],
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('still rejects non-UUID program ids', async () => {
    const dto = plainToInstance(GenerateClassesDto, {
      schoolYearId: V4,
      programIds: ['college'],
      semesterId: V4,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('accepts v5 ids in the readiness query', async () => {
    const dto = plainToInstance(GenerateReadinessDto, {
      schoolYearId: V5,
      programIds: [V5],
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});
