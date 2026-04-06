import { Controller, Get } from '@nestjs/common'
import { successResponse } from '../../common/http/api-response'

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return successResponse(
      {
        status: 'ok',
        timestamp: new Date().toISOString()
      },
      '健康检查通过'
    )
  }
}
