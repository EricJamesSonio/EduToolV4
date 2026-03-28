import { Test, TestingModule } from '@nestjs/testing';
import { SubjectPrerequisiteController } from './subject-prerequisite.controller';

describe('SubjectPrerequisiteController', () => {
  let controller: SubjectPrerequisiteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectPrerequisiteController],
    }).compile();

    controller = module.get<SubjectPrerequisiteController>(SubjectPrerequisiteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
