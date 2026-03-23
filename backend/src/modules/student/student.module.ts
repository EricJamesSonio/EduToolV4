// src/modules/student/student.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { StudentRepository } from './student.repository';

@Module({
  imports: [
    // Store uploaded CSV in memory buffer — no disk writes needed
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [StudentController],
  providers: [StudentService, StudentRepository],
  exports: [StudentService], // exported for Phase 3: enrollment validation, section capacity
})
export class StudentModule {}