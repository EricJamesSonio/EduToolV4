// src/core/logger/logger.module.ts
import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from './logger';

@Module({
  imports: [
    WinstonModule.forRoot({
      instance: winstonLogger,
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
