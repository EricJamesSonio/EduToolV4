import { Test, TestingModule } from '@nestjs/testing';
import { GradingSchemeController } from './grading-scheme.controller';

describe('GradingSchemeController', () => {
  let controller: GradingSchemeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradingSchemeController],
    }).compile();

    controller = module.get<GradingSchemeController>(GradingSchemeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
