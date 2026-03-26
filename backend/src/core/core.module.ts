// src/core/core.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// configs
import appConfig from '../configs/app.config';
import jwtConfig from '../configs/jwt.config';
import dbConfig from '../configs/db.config';
import { envValidationSchema } from '../configs/env.validation';

// infra
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { AiModule } from './ai/ai.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, dbConfig],
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    LoggerModule,
    AiModule,
  ],
  exports: [DatabaseModule, LoggerModule, ConfigModule],
})
export class CoreModule {}