// @/modules/rubric/rubric.module.ts
import { Module } from '@nestjs/common';
import { RubricController } from './rubric.controller';
import { RubricService } from './rubric.service';
import { RubricRepository } from './rubric.repository';

@Module({
  controllers: [RubricController],
  providers: [RubricService, RubricRepository],
  exports: [RubricService], // exported for Phase 3: enrollment lock, class assignment, grade computation
})
export class RubricModule {}