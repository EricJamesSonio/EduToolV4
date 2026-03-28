import { Test, TestingModule } from '@nestjs/testing';
import { StrandController } from './strand.controller';

describe('StrandController', () => {
  let controller: StrandController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StrandController],
    }).compile();

    controller = module.get<StrandController>(StrandController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
