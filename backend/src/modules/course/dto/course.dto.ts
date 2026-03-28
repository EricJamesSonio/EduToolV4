import { IsString, IsOptional, IsNotEmpty } from 'class-validator'

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  org_id: string

  @IsString()
  @IsNotEmpty()
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