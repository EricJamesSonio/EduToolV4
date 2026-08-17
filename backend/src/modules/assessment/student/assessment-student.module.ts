// @/modules/assessment/student/assessment-student.module.ts
import { Module } from '@nestjs/common';
import { AssessmentStudentController } from './assessment-student.controller';
import { AssessmentStudentService } from './assessment-student.service';
import { AssessmentCoreModule } from '../core/assessment-core.module';
import { ClassModule } from '@/modules/class/class.module';
import { GradeRepository } from '@/modules/grade/grade.repository';
import { EnrollmentRepository } from '@/modules/enrollment/enrollment.repository';

@Module({
  imports: [AssessmentCoreModule, ClassModule],
  controllers: [AssessmentStudentController],
  providers: [AssessmentStudentService, GradeRepository, EnrollmentRepository],
})
export class AssessmentStudentModule {}
