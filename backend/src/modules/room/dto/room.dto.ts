import { IsString, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';

export class RoomNameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;
}

export class QueryRoomUsageDto {
  @IsUUID()
  schoolYearId!: string;

  /** Omit to get every room-assigned slot in the school year. */
  @IsOptional()
  @IsUUID()
  roomId?: string;
}