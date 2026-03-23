import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from './configs/app.config';
import jwtConfig from './configs/jwt.config';
import dbConfig from './configs/db.config';
import { envValidationSchema } from './configs/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, dbConfig],
      validationSchema: envValidationSchema,
    }),
  ],
})
export class AppModule {}