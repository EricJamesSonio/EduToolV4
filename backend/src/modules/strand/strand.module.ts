import { Module } from '@nestjs/common';
import { StrandService } from './strand.service';
import { StrandController } from './strand.controller';

@Module({
  providers: [StrandService],
  controllers: [StrandController]
})
export class StrandModule {}
