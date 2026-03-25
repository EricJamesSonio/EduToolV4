import { Module } from '@nestjs/common';
import { EducatorController } from './educator.controller';
import { EducatorService } from './educator.service';
import { EducatorRepository } from './educator.repository';
import { ClassModule } from '../class/class.module'; // ✅ ADD THIS

@Module({
  imports: [ClassModule], // ✅ THIS FIXES IT
  controllers: [EducatorController],
  providers: [EducatorService, EducatorRepository],
  exports: [EducatorService],
})
export class EducatorModule {}