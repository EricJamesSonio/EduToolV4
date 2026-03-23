// src/modules/level/level.module.ts
import { Module } from '@nestjs/common';
import { LevelController } from './level.controller';
import { LevelService } from './level.service';
import { LevelRepository } from './level.repository';

@Module({
  controllers: [LevelController],
  providers: [LevelService, LevelRepository],
  exports: [LevelService], // exported for Phase 3: school-year seeding
})
export class LevelModule {}