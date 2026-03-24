import { Module } from '@nestjs/common';
import { GradeLockService } from './grade-lock.service';
import { GradeLockController } from './grade-lock.controller';

@Module({
  providers: [GradeLockService],
  controllers: [GradeLockController]
})
export class GradeLockModule {}
