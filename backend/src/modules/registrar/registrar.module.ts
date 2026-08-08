// @/modules/registrar/registrar.module.ts
import { Module } from '@nestjs/common';
import { RegistrarController } from './registrar.controller';
import { RegistrarService } from './registrar.service';
import { RegistrarRepository } from './registrar.repository';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [OrganizationModule],
  controllers: [RegistrarController],
  providers: [RegistrarService, RegistrarRepository],
  exports: [RegistrarService],
})
export class RegistrarModule {}