import { Test, TestingModule } from '@nestjs/testing';
import { AcademicCalendarController } from './academic-calendar.controller';

describe('AcademicCalendarController', () => {
  let controller: AcademicCalendarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicCalendarController],
    }).compile();

    controller = module.get<AcademicCalendarController>(AcademicCalendarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
