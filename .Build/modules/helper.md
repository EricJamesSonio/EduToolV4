
// ===== File: current-user.decorator.ts =====
// src/commons/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

// ===== File: ..\roles.decorator.ts =====
// src/commons/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ===== File: ..\..\filters\all-exception.filter.ts =====
// src/commons/filters/all-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    console.error(exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}

// ===== File: ..\..\filters\http-exception.filter.ts =====
// src/commons/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      success: false,
      statusCode: status,
      error: exceptionResponse,
    });
  }
}

// ===== File: ..\..\guards\auth.guard.ts =====
// src/commons/guards/auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends NestAuthGuard('jwt') {}

// ===== File: ..\..\guards\role.guard.ts =====
// src/commons/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}

// ===== File: ..\..\interceptors\logging.interceptor.ts =====
// src/commons/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const requestId = req['requestId'];

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const time = Date.now() - now;

        console.log({
          requestId,
          method,
          url,
          responseTime: `${time}ms`,
        });
      }),
    );
  }
}

// ===== File: ..\..\interceptors\response.interceptor.ts =====
// src/commons/interceptors/response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
      })),
    );
  }
}

// ===== File: ..\..\pipes\parse-int.pipe.ts =====
// src/commons/pipes/parse-int.pipe.ts
import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = Number(value);

    if (isNaN(val)) {
      throw new BadRequestException('Validation failed (numeric expected)');
    }

    return val;
  }
}

// ===== File: ..\..\pipes\validation.pipe.ts =====
// src/commons/pipes/validation.pipe.ts
import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const formatted = errors.map(err => ({
        field: err.property,
        errors: Object.values(err.constraints || {}),
      }));

      throw new BadRequestException({
        message: 'Validation failed',
        errors: formatted,
      });
    }

    return object;
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

// ===== File: ..\..\utils\hash.util.ts =====
// src/commons/utils/hash.util.ts
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string,
) => {
  return bcrypt.compare(password, hash);
};

// ===== File: ..\..\utils\token.util.ts =====
// src/commons/utils/token.util.ts
import { JwtService } from '@nestjs/jwt';

export const generateToken = (
  jwtService: JwtService,
  payload: any,
) => {
  return jwtService.sign(payload);
};

export const verifyToken = (
  jwtService: JwtService,
  token: string,
) => {
  return jwtService.verify(token);
};

// ===== File: ..\..\..\configs\app.config.ts =====
// src/configs/app.config.ts
export default () => ({
  app: {
    name: process.env.APP_NAME || 'EduTool',
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.NODE_ENV || 'development',
  },
});

// ===== File: ..\..\..\configs\db.config.ts =====
// src/configs/db.config.ts
export default () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
});

// ===== File: ..\..\..\configs\env.validation.ts =====
// src/configs/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  APP_NAME: Joi.string().default('EduTool'),
});

// ===== File: ..\..\..\configs\jwt.config.ts =====
// src/configs/jwt.config.ts
export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
});

// ===== File: ..\..\..\core\database\database.module.ts =====
// src/core/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.provider';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

// ===== File: ..\..\..\core\database\database.provider.ts =====
import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super(); // ✅ REQUIRED
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// ===== File: ..\..\..\core\logger\logger.module.ts =====
// src/core/logger/logger.module.ts
import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from './logger';

@Module({
  imports: [
    WinstonModule.forRoot({
      instance: winstonLogger,
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}

// ===== File: ..\..\..\core\logger\logger.ts =====
// src/core/logger/logger.ts
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, errors, json } = format;

const logFormat = printf(({ level, message, timestamp, stack, context }) => {
  return JSON.stringify({
    level,
    message,
    context,
    timestamp,
    stack,
  });
});

export const winstonLogger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console(),
  ],
});

// ===== File: ..\..\..\core\middleware\request-id.middleware.ts =====
// src/core/middleware/request-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();

    req['requestId'] = requestId;

    res.setHeader('X-Request-Id', requestId);

    next();
  }
}

// ===== File: ..\..\..\main.ts =====
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from './commons/pipes/validation.pipe';
import { HttpExceptionFilter } from './commons/filters/http-exception.filter';
import { AllExceptionFilter } from './commons/filters/all-exception.filter';
import { LoggingInterceptor } from './commons/interceptors/logging.interceptor';
import { ResponseInterceptor } from './commons/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new AllExceptionFilter(),
  );

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  const PORT = process.env.PORT || 3000;

  await app.listen(PORT);
}
bootstrap();
