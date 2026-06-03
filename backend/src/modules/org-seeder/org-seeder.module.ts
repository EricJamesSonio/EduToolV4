import { Module } from '@nestjs/common'
import { OrgSeederService } from './org-seeder.service'
import { ProgramSeederService } from './seeders/program-seeder.service'
import { CourseSeederService } from './seeders/course-seeder.service'
import { StrandSeederService } from './seeders/strand-seeder.service'
import { LevelSectionSeederService } from './seeders/level-section-seeder.service'
import { GradingScaleSeederService } from './seeders/grading-scale-seeder.service'
import { GradingSchemeSeederService } from './seeders/grading-scheme-seeder.service'
import { SemesterTemplateSeederService } from './seeders/semester-template-seeder.service'
import { MajorSubjectSeederService } from './seeders/major-subject-seeder.service'
import { MinorSubjectSeederService } from './seeders/minor-subject-seeder.service'
import { PrerequisiteSeederService } from './seeders/prerequisite-seeder.service'

@Module({
  providers: [
    OrgSeederService,
    ProgramSeederService,
    CourseSeederService,
    StrandSeederService,
    LevelSectionSeederService,
    GradingScaleSeederService,
    GradingSchemeSeederService,
    SemesterTemplateSeederService,
    MajorSubjectSeederService,
    MinorSubjectSeederService,
    PrerequisiteSeederService,
  ],
  exports: [OrgSeederService],
})
export class OrgSeederModule {}
