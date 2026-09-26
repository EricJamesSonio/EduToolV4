import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.provider';

interface HealthPayload {
  status: string;
  message: string;
  timestamp: Date;
}

interface DetailedHealthPayload extends HealthPayload {
  database: string;
  dbLatencyMs?: number;
}

@Controller()
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  root(): HealthPayload {
    // Kept shape-compatible: existing monitors/pollers expect {status,message,timestamp}.
    return {
      status: 'ok',
      message: 'Backend is running 🚀',
      timestamp: new Date(),
    };
  }

  @Get('check')
  async check(): Promise<DetailedHealthPayload> {
    // Perf Phase 0: real DB ping so /check fails when Postgres is unreachable.
    // No @nestjs/terminus dep by design (reuse DatabaseService; same signal, zero dep).
    const start = process.hrtime.bigint();

    try {
      await this.db.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        message: 'Database unreachable',
        database: 'down',
        timestamp: new Date(),
      });
    }

    const dbLatencyMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    return {
      status: 'ok',
      message: 'Backend is running 🚀',
      timestamp: new Date(),
      database: 'up',
      dbLatencyMs: Math.round(dbLatencyMs * 100) / 100,
    };
  }
}
