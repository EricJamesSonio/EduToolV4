import { Module } from '@nestjs/common'
import { SubjectPrerequisiteController } from './subject-prerequisite.controller'
import { SubjectPrerequisiteService } from './subject-prerequisite.service'
import { SubjectPrerequisiteRepository } from './subject-prerequisite.repository'

@Module({
  controllers: [SubjectPrerequisiteController],
  providers: [SubjectPrerequisiteService, SubjectPrerequisiteRepository],
  exports: [SubjectPrerequisiteService, SubjectPrerequisiteRepository],
})
export class SubjectPrerequisiteModule {}