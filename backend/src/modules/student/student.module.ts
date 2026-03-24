// src/modules/student/student.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { StudentRepository } from './student.repository';
import { SectionModule } from 'src/modules/section/section.module';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
    SectionModule, // for section capacity enforcement
  ],
  controllers: [StudentController],
  providers: [StudentService, StudentRepository],
  exports: [StudentService],
})
export class StudentModule {}