import { Test, TestingModule } from '@nestjs/testing';
import { GradingScaleService } from './grading-scale.service';
import { GradingScaleRepository } from './grading-scale.repository';
import { GradingScaleAssignmentRepository } from './grading-scale-assignment.repository';
import { DatabaseService } from '@/core/database/database.provider';

describe('GradingScaleService', () => {
  let service: GradingScaleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradingScaleService,
        {
          provide: GradingScaleRepository,
          useValue: {},
        },
        {
          provide: GradingScaleAssignmentRepository,
          useValue: {},
        },
        {
          provide: DatabaseService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<GradingScaleService>(GradingScaleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
