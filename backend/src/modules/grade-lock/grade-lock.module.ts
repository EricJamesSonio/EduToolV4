// src/modules/grade-lock/grade-lock.module.ts
import { Module } from '@nestjs/common';
import { GradeLockController } from './grade-lock.controller';
import { GradeLockService } from './grade-lock.service';
import { GradeLockRepository } from './grade-lock.repository';
import { GradeModule } from '../grade/grade.module'; 
import { ClassModule } from '../class/class.module';

@Module({
  imports: [GradeModule, ClassModule],
  controllers: [GradeLockController],
  providers: [GradeLockService, GradeLockRepository],
})
export class GradeLockModule {}