import { Test, TestingModule } from '@nestjs/testing';
import { StrandService } from './strand.service';

describe('StrandService', () => {
  let service: StrandService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StrandService],
    }).compile();

    service = module.get<StrandService>(StrandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
