import { Module } from '@nestjs/common'
import { PrismaModule } from '../../common/prisma/prisma.module'
import { InternalController } from './internal.controller'

@Module({
  imports: [PrismaModule],
  controllers: [InternalController]
})
export class InternalModule {}
