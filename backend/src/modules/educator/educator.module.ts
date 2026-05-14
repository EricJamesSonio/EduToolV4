import { Module } from '@nestjs/common';
import { EducatorController } from './educator.controller';
import { EducatorService } from './educator.service';
import { EducatorRepository } from './educator.repository';
import { ClassModule } from '../class/class.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [ClassModule, OrganizationModule],
  controllers: [EducatorController],
  providers: [EducatorService, EducatorRepository],
  exports: [EducatorService],
})
export class EducatorModule {}
