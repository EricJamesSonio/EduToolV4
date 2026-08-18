// src/modules/concern/category/concern-category.module.ts
import { Module } from '@nestjs/common';
import { ConcernCategoryController } from './concern-category.controller';
import { ConcernCategoryService } from './concern-category.service';
import { ConcernCoreModule } from '../core/concern-core.module';

@Module({
  imports: [ConcernCoreModule],
  controllers: [ConcernCategoryController],
  providers: [ConcernCategoryService],
})
export class ConcernCategoryModule {}
