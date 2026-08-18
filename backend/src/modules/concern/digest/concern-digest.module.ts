// src/modules/concern/digest/concern-digest.module.ts
import { Module } from '@nestjs/common';
import { ConcernDigestService } from './concern-digest.service';

@Module({
  providers: [ConcernDigestService],
  exports: [ConcernDigestService],
})
export class ConcernDigestModule {}
