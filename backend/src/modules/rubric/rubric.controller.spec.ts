import { Test, TestingModule } from '@nestjs/testing';
import { RubricController } from './rubric.controller';

describe('RubricController', () => {
  let controller: RubricController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RubricController],
    }).compile();

    controller = module.get<RubricController>(RubricController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
