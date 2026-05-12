// Dashboard Stats DTO
// Data transfer object for dashboard statistics response

import { IsNumber, IsString } from 'class-validator';

export class DashboardStatsDto {
  @IsNumber()
  totalStudents: number;

  @IsNumber()
  totalEducators: number;

  @IsNumber()
  activeClasses: number;

  @IsNumber()
  programs: number;

  @IsString()
  activeSchoolYear: string;

  @IsNumber()
  pendingGradeSubmissions: number;

  @IsNumber()
  sections: number;

  @IsNumber()
  pendingTasks: number;
}
