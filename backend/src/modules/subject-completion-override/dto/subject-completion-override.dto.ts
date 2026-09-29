import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateSubjectCompletionDto {
  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateSubjectCompletionDto {
  @IsIn(['completed', 'pending'])
  status!: 'completed' | 'pending';

  @IsOptional()
  @IsString()
  reason?: string;
}
