import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

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
