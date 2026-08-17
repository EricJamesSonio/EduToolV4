// @/modules/transcript/student/transcript-student.module.ts
import { Module } from '@nestjs/common';
import { TranscriptStudentController } from './transcript-student.controller';
import { TranscriptStudentService } from './transcript-student.service';
import { GradeRepository } from '@/modules/grade/grade.repository';
import { ClassRepository } from '@/modules/class/class.repository';
import { EnrollmentRepository } from '@/modules/enrollment/enrollment.repository';

@Module({
  imports: [],
  controllers: [TranscriptStudentController],
  providers: [
    TranscriptStudentService,
    GradeRepository,
    ClassRepository,
    EnrollmentRepository,
  ],
})
export class TranscriptStudentModule {}
