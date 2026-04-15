import { Controller, Headers, HttpCode, Post, Query, UnauthorizedException } from '@nestjs/common'
import { ensureDemoData } from '../../bootstrap/demo-data'
import { successResponse } from '../../common/http/api-response'
import { PrismaService } from '../../common/prisma/prisma.service'

const bootstrapSecretEnv = 'INTERNAL_BOOTSTRAP_SECRET'

@Controller('internal')
export class InternalController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('bootstrap-demo')
  @HttpCode(200)
  async bootstrapDemo(
    @Query('secret') querySecret?: string,
    @Headers('x-bootstrap-secret') headerSecret?: string
  ) {
    const configuredSecret = process.env[bootstrapSecretEnv]?.trim()
    const providedSecret = (headerSecret ?? querySecret ?? '').trim()

    if (!configuredSecret || providedSecret !== configuredSecret) {
      throw new UnauthorizedException('Invalid internal bootstrap secret.')
    }

    await ensureDemoData(this.prisma)

    return successResponse(
      {
        ready: true,
        accounts: ['end_user_demo', 'merchant_admin_demo', 'super_admin_demo']
      },
      'Demo data bootstrap completed.'
    )
  }
}
