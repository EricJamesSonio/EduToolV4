import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator'

export class CreateCourseDto {
  @IsUUID()
  program_id: string

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
  @IsString()
  @IsOptional()
  program_id?: string
}