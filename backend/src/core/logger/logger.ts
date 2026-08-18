// src/core/logger/logger.ts
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, errors } = format;

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
  format: combine(timestamp(), errors({ stack: true }), logFormat),
  transports: [new transports.Console()],
});
