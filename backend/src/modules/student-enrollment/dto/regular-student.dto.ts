import { IsBoolean } from 'class-validator';

export class SetRegularStudentDto {
  @IsBoolean()
  is_regular!: boolean;
}