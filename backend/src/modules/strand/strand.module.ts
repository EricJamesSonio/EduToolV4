import { Module } from '@nestjs/common';
import { StrandController } from './strand.controller';
import { StrandService } from './strand.service';
import { StrandRepository } from './strand.repository';

@Module({
  controllers: [StrandController],
  providers: [StrandService, StrandRepository],
  exports: [StrandService, StrandRepository],
})
export class StrandModule {}
