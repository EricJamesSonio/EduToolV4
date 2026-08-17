// src/core/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.provider';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
