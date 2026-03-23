import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from './configs/app.config';
import jwtConfig from './configs/jwt.config';
import dbConfig from './configs/db.config';
import { envValidationSchema } from './configs/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { LevelModule } from './modules/level/level.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, dbConfig],
      validationSchema: envValidationSchema,
    }), AuthModule, LevelModule,
  ],
})
export class AppModule {}