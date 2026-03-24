import { Test, TestingModule } from '@nestjs/testing';
import { GradeLockService } from './grade-lock.service';

describe('GradeLockService', () => {
  let service: GradeLockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradeLockService],
    }).compile();

    service = module.get<GradeLockService>(GradeLockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
