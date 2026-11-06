import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// POST /grade-templates (multipart/form-data, field "file" is the workbook)
export class UploadGradeTemplateDto {
  @IsString()
  @MaxLength(100)
  schoolYearId: string;

  // Omitted or empty = the template covers every department.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  programId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  // Extra header names (comma separated) for the Student ID column.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  idHeader?: string;

  // Extra header names (comma separated) for the student name column(s).
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameHeader?: string;

  // "true" replaces an existing template for the same year and department.
  @IsOptional()
  @IsString()
  @MaxLength(10)
  replace?: string;
}

// PUT /grade-templates/:id/mapping
export class SaveGradeTemplateMappingDto {
  @IsString()
  @MaxLength(255)
  sheetName: string;

  // null (or omitted) clears the saved mapping and goes back to auto-detect.
  @IsOptional()
  @IsObject()
  mapping?: Record<string, unknown> | null;
}