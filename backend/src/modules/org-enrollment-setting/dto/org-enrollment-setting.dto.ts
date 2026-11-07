import { IsBoolean, IsOptional } from 'class-validator';

export class UpsertOrgEnrollmentSettingDto {
  @IsOptional()
  @IsBoolean()
  require_semester_reenrollment?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_unenroll_on_year_end?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_educator_scheme_override?: boolean;
}