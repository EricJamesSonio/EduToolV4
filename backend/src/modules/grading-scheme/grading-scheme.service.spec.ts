import { Test, TestingModule } from '@nestjs/testing';
import { GradingSchemeService } from './grading-scheme.service';

describe('GradingSchemeService', () => {
  let service: GradingSchemeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradingSchemeService],
    }).compile();

    service = module.get<GradingSchemeService>(GradingSchemeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
