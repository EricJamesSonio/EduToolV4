// @/modules/lesson/dto/lesson.dto.ts
import {
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  weekNumber!: number;

  @IsInt()
  @Min(1)
  subIndex!: number;

  @IsString()
  @MinLength(10)
  detail!: string;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weekNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  subIndex?: number;

  @IsOptional()
  @IsString()
  @MinLength(10)
  detail?: string;
}

export class QueryLessonDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  weekNumber?: number;
}

export class TriggerConceptExtractionDto {
  @IsUUID()
  lessonId!: string;
}
