import { Test, TestingModule } from '@nestjs/testing';
import { EducatorService } from './educator.service';

describe('EducatorService', () => {
  let service: EducatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EducatorService],
    }).compile();

    service = module.get<EducatorService>(EducatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
