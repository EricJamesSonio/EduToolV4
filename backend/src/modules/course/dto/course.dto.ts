import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator'

export class CreateCourseDto {
  @IsUUID()
  schoolYearId!: string

  @IsUUID()
  programId!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsOptional()
  @IsString()
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
  @IsOptional()
  @IsUUID()
  schoolYearId?: string

  @IsOptional()
  @IsUUID()
  programId?: string
}