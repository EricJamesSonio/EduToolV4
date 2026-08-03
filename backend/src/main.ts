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

// Load env files with a clear precedence:
//   1. `.env.local` — developer-local values. Loaded with `override: true`
//      so it wins even if the value is already present in the process env
//      (dotenv normally never overrides an existing env var). Docker/Render
//      images do NOT ship a `.env.local`, so when absent the injected
//      process vars (or `.env`) take over instead.
//   2. `.env`        — baseline values, only fills in anything not set above.
(() => {
  const localPath = join(process.cwd(), '.env.local');
  const envPath = join(process.cwd(), '.env');

  if (existsSync(localPath)) {
    const parsed = dotenv.config({ path: localPath, override: true });
    dotenvExpand.expand(parsed);
  }

  if (existsSync(envPath)) {
    const parsed = dotenv.config({ path: envPath });
    dotenvExpand.expand(parsed);
  }
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

  // CORS origins are driven by CORS_ORIGIN (comma-separated). Fails closed
  // (empty = no cross-origin requests allowed) so production never assumes a
  // hardcoded host. Example: CORS_ORIGIN=https://app.onrender.com
  const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
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
        imgSrc: [`'self'`, 'data:'],
      },
    },
  }),
);

  const PORT = Number(process.env.PORT) || 3000;
  await app.listen(PORT, '0.0.0.0');
}
bootstrap();