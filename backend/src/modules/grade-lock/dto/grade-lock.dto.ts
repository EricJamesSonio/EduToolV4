// dto/grade-lock.dto.ts
import { IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateGradeLockSettingDto {
  @IsUUID()
  schoolYearId: string;

  @IsDateString()
  lockDeadline: string;
}

export class QueryGradeLockDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @IsUUID()
  semesterId?: string;
}