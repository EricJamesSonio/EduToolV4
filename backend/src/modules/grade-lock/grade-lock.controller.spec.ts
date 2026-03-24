import { Test, TestingModule } from '@nestjs/testing';
import { GradeLockController } from './grade-lock.controller';

describe('GradeLockController', () => {
  let controller: GradeLockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradeLockController],
    }).compile();

    controller = module.get<GradeLockController>(GradeLockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
