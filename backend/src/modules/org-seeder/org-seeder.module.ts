import { Module } from '@nestjs/common'
import { OrgSeederService } from './org-seeder.service'

@Module({
  providers: [OrgSeederService],
  exports: [OrgSeederService],
})
export class OrgSeederModule {}