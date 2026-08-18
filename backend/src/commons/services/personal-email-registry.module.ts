import { Global, Module } from '@nestjs/common';
import { PersonalEmailRegistryService } from './personal-email-registry.service';

@Global()
@Module({
  providers: [PersonalEmailRegistryService],
  exports: [PersonalEmailRegistryService],
})
export class PersonalEmailRegistryModule {}
