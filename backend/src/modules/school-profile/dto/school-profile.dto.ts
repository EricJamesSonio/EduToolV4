import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateProfileCourseDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class UpdateProfileCourseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class CreateProfileStrandDto {
  @IsString()
  name!: string;
}

export class UpdateProfileStrandDto {
  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateProfileLevelDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  strandId?: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;
}

export class UpdateProfileLevelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

export class CreateProfileSectionDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  capacity!: number;
}

export class UpdateProfileSectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class CreateProfileSubjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  subjectType?: string; // 'major' | 'minor', defaults to 'major'
}

export class UpdateProfileSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;
}
