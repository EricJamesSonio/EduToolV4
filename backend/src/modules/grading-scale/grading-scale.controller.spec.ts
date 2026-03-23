import { Test, TestingModule } from '@nestjs/testing';
import { GradingScaleController } from './grading-scale.controller';

describe('GradingScaleController', () => {
  let controller: GradingScaleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradingScaleController],
    }).compile();

    controller = module.get<GradingScaleController>(GradingScaleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
