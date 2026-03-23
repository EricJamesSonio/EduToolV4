import { Test, TestingModule } from '@nestjs/testing';
import { RubricService } from './rubric.service';

describe('RubricService', () => {
  let service: RubricService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RubricService],
    }).compile();

    service = module.get<RubricService>(RubricService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
