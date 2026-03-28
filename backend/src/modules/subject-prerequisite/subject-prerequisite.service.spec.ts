import { Test, TestingModule } from '@nestjs/testing';
import { SubjectPrerequisiteService } from './subject-prerequisite.service';

describe('SubjectPrerequisiteService', () => {
  let service: SubjectPrerequisiteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubjectPrerequisiteService],
    }).compile();

    service = module.get<SubjectPrerequisiteService>(SubjectPrerequisiteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
