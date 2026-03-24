import { Controller, Get } from '@nestjs/common';

@Controller('check')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      message: 'Backend is running 🚀',
      timestamp: new Date(),
    };
  }
}