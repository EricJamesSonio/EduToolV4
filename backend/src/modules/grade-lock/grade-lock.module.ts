import { Module } from '@nestjs/common'
import { GradeLockController } from './grade-lock.controller'
import { GradeLockService } from './grade-lock.service'
import { GradeLockRepository } from './grade-lock.repository'
import { GradeLockValidator } from './grade-lock.validator'
import { GradeEducatorModule } from '../grade/educator/grade-educator.module'
import { ClassModule } from '../class/class.module'

@Module({
  imports: [
    GradeEducatorModule,
    ClassModule,
  ],
  controllers: [GradeLockController],
  providers: [GradeLockService, GradeLockRepository, GradeLockValidator],
  exports: [GradeLockService, GradeLockValidator],
})
export class GradeLockModule {}