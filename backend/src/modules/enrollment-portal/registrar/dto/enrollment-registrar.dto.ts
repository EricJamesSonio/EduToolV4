// src/modules/enrollment-portal/registrar/dto/enrollment-registrar.dto.ts
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentApplicationStatus, SectionOverflowAction } from '@prisma/client';

export class CreateEnrollmentPeriodDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsNotEmpty()
  school_year_id!: string;

  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;

  @IsDateString()
  lock_date!: string;

  @IsOptional()
  @IsEnum(SectionOverflowAction as unknown as object)
  section_overflow_action?: SectionOverflowAction;
}

export class UpdateEnrollmentPeriodDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsDateString()
  lock_date?: string;

  @IsOptional()
  @IsEnum(SectionOverflowAction as unknown as object)
  section_overflow_action?: SectionOverflowAction;
}

export class QueryApplicationsDto {
  @IsOptional()
  @IsString()
  application_code?: string;

  @IsOptional()
  @IsEmail()
  personal_email?: string;

  @IsOptional()
  @IsEnum(EnrollmentApplicationStatus as unknown as object)
  status?: EnrollmentApplicationStatus;

  @IsOptional()
  @IsString()
  period_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class RejectApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class UnlockApplicationDto {
  @IsOptional()
  @IsEmail()
  personal_email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  application_code?: string;
}