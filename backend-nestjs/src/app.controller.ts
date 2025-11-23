import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getWelcome() {
    return {
      message: 'Welcome to Retirement Planning API',
      version: '2.0',
      documentation: '/api',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'healthy',
      message: 'Retirement Planning API is running',
      environment: process.env.ENVIRONMENT || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
