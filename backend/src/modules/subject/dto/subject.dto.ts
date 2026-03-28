import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator'

export class CreateSubjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string

  @IsUUID()
  levelId: string

  @IsOptional()
  @IsUUID()
  educatorId?: string

  /**
   * NULL = open/minor subject — visible to all courses
   * set  = course-coupled major — only visible when this course is selected
   */
  @IsOptional()
  @IsUUID()
  courseId?: string

  /**
   * For SHS strands (STEM, ABM, HUMSS, etc.)
   */
  @IsOptional()
  @IsUUID()
  strandId?: string

  /**
   * e.g. "1st Year", "2nd Year", "Grade 11"
   */
  @IsOptional()
  @IsString()
  yearLevel?: string

  /**
   * e.g. "1st Sem", "2nd Sem"
   */
  @IsOptional()
  @IsString()
  termLabel?: string
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string

  @IsOptional()
  @IsUUID()
  levelId?: string

  @IsOptional()
  @IsUUID()
  educatorId?: string

  @IsOptional()
  @IsUUID()
  courseId?: string

  @IsOptional()
  @IsUUID()
  strandId?: string

  @IsOptional()
  @IsString()
  yearLevel?: string

  @IsOptional()
  @IsString()
  termLabel?: string
}

export class QuerySubjectDto {
  @IsOptional()
  @IsUUID()
  levelId?: string

  @IsOptional()
  @IsUUID()
  educatorId?: string

  @IsOptional()
  @IsString()
  search?: string

  /**
   * Filter by course. When provided, returns:
   *   - all open subjects (course_id IS NULL)
   *   - subjects coupled to this course (course_id = courseId)
   * When omitted, returns all subjects for the org.
   */
  @IsOptional()
  @IsUUID()
  courseId?: string

  /**
   * Filter by strand (SHS).
   * Returns open subjects + subjects coupled to this strand.
   */
  @IsOptional()
  @IsUUID()
  strandId?: string

  /**
   * "open"   — only open/minor subjects (course_id IS NULL)
   * "coupled" — only course-coupled subjects (course_id IS NOT NULL)
   * omit     — no scope filter
   */
  @IsOptional()
  @IsIn(['open', 'coupled'])
  scope?: 'open' | 'coupled'

  @IsOptional()
  @IsString()
  yearLevel?: string

  @IsOptional()
  @IsString()
  termLabel?: string
}