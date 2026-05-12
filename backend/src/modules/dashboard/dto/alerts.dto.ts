// Alerts DTO
// Data transfer object for alerts response

import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export enum AlertType {
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
}

export class AlertDto {
  @IsString()
  id: string;

  @IsEnum(AlertType)
  type: AlertType;

  @IsString()
  message: string;

  @IsOptional()
  @IsNumber()
  count?: number;

  @IsOptional()
  @IsString()
  actionUrl?: string;
}
