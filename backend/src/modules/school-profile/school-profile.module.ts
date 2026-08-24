import { Module } from '@nestjs/common';
import { SchoolProfileController } from './school-profile.controller';
import { SchoolProfileService } from './school-profile.service';
import { SchoolProfileRepository } from './school-profile.repository';

@Module({
  controllers: [SchoolProfileController],
  providers: [SchoolProfileService, SchoolProfileRepository],
  exports: [SchoolProfileService],
})
export class SchoolProfileModule {}
