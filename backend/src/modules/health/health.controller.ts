import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      status: 'ok',
      message: 'Backend is running 🚀',
      timestamp: new Date(),
    };
  }

  @Get('check')
  check() {
    return {
      status: 'ok',
      message: 'Backend is running 🚀',
      timestamp: new Date(),
    };
  }
}
