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