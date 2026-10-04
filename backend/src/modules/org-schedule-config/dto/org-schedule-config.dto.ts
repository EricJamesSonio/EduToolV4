import { Type } from 'class-transformer';
import {
  IsString,
  Matches,
  IsInt,
  IsIn,
  IsArray,
  IsOptional,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';

const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class OrgScheduleBreakDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label!: string;

  @IsString()
  @Matches(HHMM_REGEX, { message: 'break start must be HH:MM (00:00-23:59)' })
  start!: string;

  @IsString()
  @Matches(HHMM_REGEX, { message: 'break end must be HH:MM (00:00-23:59)' })
  end!: string;
}

export class UpsertOrgScheduleConfigDto {
  @IsString()
  @Matches(HHMM_REGEX, { message: 'startTime must be HH:MM (00:00-23:59)' })
  startTime!: string;

  @IsString()
  @Matches(HHMM_REGEX, { message: 'endTime must be HH:MM (00:00-23:59)' })
  endTime!: string;

  @IsInt()
  @IsIn([15, 20, 25, 30, 45, 60], { message: 'slotDuration must be one of 15,20,25,30,45,60' })
  slotDuration!: number;

  /**
   * Weekdays the school holds classes, 0 = Sunday .. 6 = Saturday. Must be
   * non-empty (a school closed every day of the week is not a valid state) and
   * unique.
   */
  @IsArray()
  @ArrayMinSize(1, { message: 'activeWeekdays must contain at least one weekday' })
  @ArrayMaxSize(7)
  @ArrayUnique({ message: 'activeWeekdays must not contain duplicates' })
  @IsInt({ each: true })
  @IsIn([0, 1, 2, 3, 4, 5, 6], {
    each: true,
    message: 'activeWeekdays entries must be 0-6 (0 = Sunday)',
  })
  activeWeekdays!: number[];

  /** Optional so an older client that does not send it keeps working; the
   *  service falls back to the stored value (or all seven days). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6, { message: 'a maximum of 6 breaks is supported' })
  @ValidateNested({ each: true })
  @Type(() => OrgScheduleBreakDto)
  breaks?: OrgScheduleBreakDto[];
}
