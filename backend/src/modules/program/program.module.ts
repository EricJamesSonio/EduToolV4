import { Module } from '@nestjs/common'
import { ProgramController } from './program.controller'
import { ProgramService } from './program.service'
import { ProgramRepository } from './program.repository'
import { AuditLogModule } from '../audit-log/audit-log.module'

@Module({
  imports: [AuditLogModule],
  controllers: [ProgramController],
  providers: [ProgramService, ProgramRepository],
  exports: [ProgramService, ProgramRepository],
})
export class ProgramModule {}