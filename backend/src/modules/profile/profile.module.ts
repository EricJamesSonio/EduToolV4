import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileRepository } from './profile.repository';

@Module({
  imports: [AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository],
  exports: [ProfileService],
})
export class ProfileModule {}
