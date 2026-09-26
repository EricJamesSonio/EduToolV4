// src/core/cache/app-cache.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppCacheService } from './app-cache.service';

@Module({
  imports: [
    CacheModule.register({
      // In-memory store (cache-manager v5 default). Bounded so a large org
      // cannot grow the heap without limit; per-entry TTLs set at call sites.
      // Redis swap (needs REDIS_URL + infra decision): replace `store` here —
      // AppCacheService API stays unchanged. See TICK-INFRA-007 handoff.
      max: 2000,
      isGlobal: true,
    }),
  ],
  providers: [AppCacheService],
  exports: [AppCacheService],
})
export class AppCacheModule {}
