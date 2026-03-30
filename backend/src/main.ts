import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';          // 👈 add
import { HttpExceptionFilter } from './commons/filters/http-exception.filter';
import { AllExceptionFilter } from './commons/filters/all-exception.filter';
import { LoggingInterceptor } from './commons/interceptors/logging.interceptor';
import { ResponseInterceptor } from './commons/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));                   // 👈 add

app.useGlobalPipes(new ValidationPipe({ 
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}));
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new AllExceptionFilter(),
  );
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  app.enableCors();

  const PORT = Number(process.env.PORT) || 3000;
  await app.listen(PORT);
}
bootstrap();