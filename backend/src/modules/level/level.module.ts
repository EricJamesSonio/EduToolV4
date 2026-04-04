// @/modules/level/level.module.ts
import { Module } from '@nestjs/common';
import { LevelController } from './level.controller';
import { LevelService } from './level.service';
import { LevelRepository } from './level.repository';
import { DatabaseModule } from '@/core/database/database.module'; 

@Module({
  imports: [DatabaseModule], // add this
  controllers: [LevelController],
  providers: [LevelService, LevelRepository],
  exports: [LevelService],
})
export class LevelModule {}