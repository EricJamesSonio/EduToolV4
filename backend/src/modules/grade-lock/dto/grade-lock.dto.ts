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
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
} from 'class-validator';

export const LOCK_TYPES = ['hard', 'soft', 'flexible'] as const;
export type LockType = (typeof LOCK_TYPES)[number];

// ─── Settings ─────────────────────────────────────────────────────────────────

export class CreateGradeLockSettingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(LOCK_TYPES)
  lockType: LockType;

  @IsOptional()
  @IsDateString()
  lock_deadline?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  deadlineDays?: number;

  @IsBoolean()
  allowOverride: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}



export class UpdateGradeLockSettingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(LOCK_TYPES)
  lockType?: LockType;

  @IsOptional()
  @IsDateString()
  lock_deadline?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  deadlineDays?: number;

  @IsOptional()
  @IsBoolean()
  allowOverride?: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export class AssignSettingDto {
  @IsUUID()
  class_id: string;

  @IsUUID()
  setting_id: string;
}

/**
 * Bulk variant of AssignSettingDto. Applies one template to many classes in a
 * single set-based operation. Capped at 1000 ids per request; the frontend
 * chunks larger selections and calls the endpoint sequentially.
 */
export class AssignSettingBulkDto {
  @IsUUID()
  setting_id: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1000)
  @IsUUID('all', { each: true })
  class_ids: string[];
}


// ─── Lock Actions ─────────────────────────────────────────────────────────────

export class LockClassDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UnlockClassDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class OverrideGradeLockDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ─── Unlock Requests ───────────────────────────────────────────────────────────

export class RequestUnlockDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class GrantUnlockDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsDateString()
  newDeadline?: string;
}

export class DenyUnlockDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ─── Query ────────────────────────────────────────────────────────────────────

export class QueryGradeLockDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @IsUUID()
  semesterId?: string;
}
