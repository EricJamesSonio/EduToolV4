// @/modules/transcript/transcript.module.ts
import { Module } from '@nestjs/common';
import { TranscriptStudentModule } from './student/transcript-student.module';

@Module({
  imports: [TranscriptStudentModule],
})
export class TranscriptModule {}