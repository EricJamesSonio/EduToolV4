import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class SaveProfileSectionDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  capacity!: number;
}

export class SaveProfileSubjectDto {
  @IsString()
  name!: string;

  @IsIn(['major', 'minor'])
  subjectType!: 'major' | 'minor';
}

export class SaveProfileLevelDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileSectionDto)
  sections!: SaveProfileSectionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileSubjectDto)
  subjects!: SaveProfileSubjectDto[];
}

export class SaveProfileCourseDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileLevelDto)
  levels!: SaveProfileLevelDto[];
}

export class SaveProfileStrandDto {
  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileLevelDto)
  levels!: SaveProfileLevelDto[];
}

export class SaveProfileDepartmentDto {
  @IsString()
  type!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileCourseDto)
  courses!: SaveProfileCourseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileStrandDto)
  strands!: SaveProfileStrandDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileLevelDto)
  levels!: SaveProfileLevelDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileSubjectDto)
  subjects!: SaveProfileSubjectDto[];
}

export class SaveProfileGradingRangeDto {
  @IsString()
  label!: string;

  @IsInt()
  minScore!: number;

  @IsInt()
  maxScore!: number;

  @IsString()
  gradeValue!: string;
}

export class SaveProfileGradingScaleDto {
  @IsString()
  programType!: string;

  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileGradingRangeDto)
  ranges!: SaveProfileGradingRangeDto[];
}

export class SaveProfileSchemeComponentDto {
  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  weight!: number;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}

export class SaveProfileGradingSchemeDto {
  @IsString()
  programType!: string;

  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileSchemeComponentDto)
  components!: SaveProfileSchemeComponentDto[];
}

export class SaveProfileSemesterTermConfigDto {
  @IsString()
  programType!: string;

  @IsArray()
  @IsString({ each: true })
  terms!: string[];
}

export class SaveSchoolProfileDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileDepartmentDto)
  departments!: SaveProfileDepartmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileGradingScaleDto)
  gradingScales?: SaveProfileGradingScaleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileGradingSchemeDto)
  gradingSchemes?: SaveProfileGradingSchemeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveProfileSemesterTermConfigDto)
  semesterTermConfigs?: SaveProfileSemesterTermConfigDto[];
}