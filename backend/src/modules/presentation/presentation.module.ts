import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { PresentationRepository } from './presentation.repository';
import { LessonModule } from '../lesson/lesson.module';

@Module({
  imports: [LessonModule],
  controllers: [PresentationController],
  providers: [PresentationService, PresentationRepository],
  exports: [PresentationService],
})
export class PresentationModule {}
