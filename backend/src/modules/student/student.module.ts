// @/modules/student/student.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { StudentRepository } from './student.repository';
import { SectionModule } from '@/modules/section/section.module';
import { ClassModule } from '../class/class.module';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
    SectionModule, ClassModule
  ],
  controllers: [StudentController],
  providers: [StudentService, StudentRepository],
  exports: [StudentService],
})
export class StudentModule {}