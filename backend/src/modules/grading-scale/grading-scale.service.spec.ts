import { Test, TestingModule } from '@nestjs/testing';
import { GradingScaleService } from './grading-scale.service';

describe('GradingScaleService', () => {
  let service: GradingScaleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradingScaleService],
    }).compile();

    service = module.get<GradingScaleService>(GradingScaleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
