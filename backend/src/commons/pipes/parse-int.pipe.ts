// src/commons/pipes/parse-int.pipe.ts
import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = Number(value);

    if (isNaN(val)) {
      throw new BadRequestException('Validation failed (numeric expected)');
    }

    return val;
  }
}