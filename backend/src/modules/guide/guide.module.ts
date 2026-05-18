import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { GuideController } from './guide.controller';
import { GuideService } from './guide.service';
import { ImageStorageService } from './services/image-storage.service';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  ],
  controllers: [GuideController],
  providers: [GuideService, ImageStorageService],
})
export class GuideModule {}
