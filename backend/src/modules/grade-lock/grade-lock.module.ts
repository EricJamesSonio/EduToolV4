// grade-lock.module.ts
import { Module } from '@nestjs/common';
import { GradeLockController } from './grade-lock.controller';
import { GradeLockService } from './grade-lock.service';
import { GradeLockRepository } from './grade-lock.repository';

@Module({
  controllers: [GradeLockController],
  providers: [GradeLockService, GradeLockRepository],
})
export class GradeLockModule {}