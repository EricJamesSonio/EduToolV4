import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from './configs/app.config';
import jwtConfig from './configs/jwt.config';
import dbConfig from './configs/db.config';
import { envValidationSchema } from './configs/env.validation';

import { AuthModule } from './modules/auth/auth.module';
import { LevelModule } from './modules/level/level.module';
import { DatabaseModule } from './core/database/database.module'; 
import { HealthModule } from './modules/health/health.module';
import { ClassModule } from './modules/class/class.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { SubmissionModule } from './modules/submission/submission.module';
import { RubricModule } from './modules/rubric/rubric.module';
import { StudentModule } from './modules/student/student.module';
import { SubjectModule } from './modules/subject/subject.module';
import { SemesterModule } from './modules/semester/semester.module';
import { PlatformModule } from './modules/platform/platform.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, dbConfig],
      validationSchema: envValidationSchema,
    }),

    DatabaseModule, // 🔥 REQUIRED

    AuthModule,
    LevelModule,
    HealthModule,
    ClassModule,
    AssessmentModule,
    SubmissionModule,
    RubricModule,
    StudentModule,
    SubjectModule,
    SemesterModule,
    PlatformModule
  ],
})
export class AppModule {}