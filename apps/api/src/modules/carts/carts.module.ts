import { Module } from '@nestjs/common'
import { PrismaModule } from '../../common/prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { CartsController } from './carts.controller'
import { CartsService } from './carts.service'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService]
})
export class CartsModule {}
