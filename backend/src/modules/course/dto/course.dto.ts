import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator'

export class CreateCourseDto {
  @IsUUID()
  programId: string  // ← camelCase

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  code?: string
}

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  code?: string
}

export class CourseQueryDto {
  @IsUUID()
  @IsOptional()
  programId?: string  // ← camelCase
}