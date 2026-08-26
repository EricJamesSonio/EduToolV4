import { IsString, Matches, IsInt, IsIn } from 'class-validator';

const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

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
}
