// src/modules/concern/core/concern-core.module.ts
import { Module } from '@nestjs/common';
import { ConcernCoreService } from './concern-core.service';
import { ConcernCoreRepository } from './concern-core.repository';

@Module({
  providers: [ConcernCoreService, ConcernCoreRepository],
  exports: [ConcernCoreService, ConcernCoreRepository],
})
export class ConcernCoreModule {}