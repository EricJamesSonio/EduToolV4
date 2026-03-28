// src/modules/grade/student/grade-student.module.ts
import { Module } from '@nestjs/common';
import { GradeStudentController } from './grade-student.controller';
import { GradeStudentService } from './grade-student.service';
import { GradeRepository } from '../grade.repository';
import { ClassModule } from 'src/modules/class/class.module';
import { EnrollmentRepository } from '@/modules/enrollment/enrollment.repository';

@Module({
  imports: [ClassModule],
  controllers: [GradeStudentController],
  providers: [GradeStudentService, GradeRepository, EnrollmentRepository],
})
export class GradeStudentModule {}