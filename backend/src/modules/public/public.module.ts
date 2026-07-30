import { Module } from '@nestjs/common'
import { OrganizationModule } from '@/modules/organization/organization.module'
import { PublicController } from './public.controller'

@Module({
  imports: [OrganizationModule],
  controllers: [PublicController],
})
export class PublicModule {}
