import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { existsSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { HttpExceptionFilter } from './commons/filters/http-exception.filter';
import { AllExceptionFilter } from './commons/filters/all-exception.filter';
import { LoggingInterceptor } from './commons/interceptors/logging.interceptor';
import { ResponseInterceptor } from './commons/interceptors/response.interceptor';
import helmet from 'helmet';

// Load env files with real (shell/container) vars taking priority.
// Order matters: `.env.local` is loaded first and overrides `.env`, so a
// developer running locally gets localhost values while Docker / Render
// inject values via the actual process environment (dotenv never overrides
// an already-present process env var unless `override` is true).
(() => {
  const files: string[] = [];
  for (const name of ['.env.local', '.env']) {
    const path = join(process.cwd(), name);
    if (existsSync(path)) files.push(path);
  }
  const parsed = dotenv.config({ path: files, quiet: true });
  dotenvExpand.expand(parsed);
})();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));

  // 👇 Serve everything under /uploads (profiles, organizations, etc.)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new AllExceptionFilter(),
  );

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // 👇 crossOriginResourcePolicy relaxed so images served from /uploads
  // aren't blocked by the browser when fetched from a different origin/port
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        imgSrc: [`'self'`, 'data:', 'http://localhost:5000', 'http://localhost:3000'],
      },
    },
  }),
);

  const PORT = Number(process.env.PORT) || 3000;
  await app.listen(PORT, '0.0.0.0');
}
bootstrap();