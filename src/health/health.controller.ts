import { Controller, Get, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import axios from 'axios';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  checkHealth() {
    return this.healthService.checkHealth();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get health check service statistics' })
  @ApiResponse({ status: 200, description: 'Health service statistics' })
  getStats() {
    return this.healthService.getStats();
  }

  @Get('ping')
  @ApiOperation({ summary: 'Manual health ping' })
  @ApiResponse({ status: 200, description: 'Manual ping executed' })
  async manualPing() {
    return await this.healthService.pingSelf();
  }
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    const port = this.configService.get('PORT') || 3001;
    this.baseUrl =
      process.env.NODE_ENV === 'production'
        ? this.configService.get('BACKEND_URL') || ``
        : `http://127.0.0.1:${port}`;
  }

  @Cron('*/10 * * * *')
  async pingSelf() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 30000,
      });

      const responseTime = Date.now() - startTime;

      this.logger.log(
        `✅ Self-ping successful - Status: ${response.status}, Response time: ${responseTime}ms`,
      );

      return {
        success: true,
        status: response.status,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`❌ Self-ping failed: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getStats() {
    return {
      service: 'Health Check Service',
      cronSchedule: 'Every 10 minutes (*/10 * * * *)',
      nextRun: 'Check logs for last ping status',
      endpoint: `${this.baseUrl}/health`,
    };
  }
}
