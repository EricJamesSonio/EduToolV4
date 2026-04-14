import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsIn,
  IsNotEmpty,
  Min,
} from 'class-validator'

export const LOCK_TYPES = ['hard', 'soft', 'flexible'] as const
export type LockType = (typeof LOCK_TYPES)[number]

// ─── Settings ─────────────────────────────────────────────────────────────────

export class CreateGradeLockSettingDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsIn(LOCK_TYPES)
  lockType: LockType

  @IsOptional()
  @IsDateString()
  lock_deadline?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  deadlineDays?: number

  @IsBoolean()
  allowOverride: boolean

  @IsOptional()
  @IsBoolean()
  is_default?: boolean
}

export class UpdateGradeLockSettingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsIn(LOCK_TYPES)
  lockType?: LockType

  @IsOptional()
  @IsDateString()
  lock_deadline?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  deadlineDays?: number

  @IsOptional()
  @IsBoolean()
  allowOverride?: boolean

  @IsOptional()
  @IsBoolean()
  is_default?: boolean
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export class AssignSettingDto {
  @IsUUID()
  class_id: string

  @IsUUID()
  setting_id: string
}

// ─── Lock Actions ─────────────────────────────────────────────────────────────

export class LockClassDto {
  @IsOptional()
  @IsString()
  reason?: string
}

export class UnlockClassDto {
  @IsString()
  @IsNotEmpty()
  reason: string
}

export class OverrideGradeLockDto {
  @IsString()
  @IsNotEmpty()
  reason: string
}

// ─── Query ────────────────────────────────────────────────────────────────────

export class QueryGradeLockDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string

  @IsOptional()
  @IsUUID()
  semesterId?: string
}