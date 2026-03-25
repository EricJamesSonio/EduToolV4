// src/modules/grade/student/grade-student.module.ts
import { Module } from '@nestjs/common';
import { GradeStudentController } from './grade-student.controller';
import { GradeStudentService } from './grade-student.service';
import { ClassModule } from 'src/modules/class/class.module';

@Module({
  imports: [ClassModule],
  controllers: [GradeStudentController],
  providers: [GradeStudentService],
})
export class GradeStudentModule {}