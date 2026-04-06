import { Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { TokenService } from '../../common/auth/token.service'
import { AuthGuard } from '../../common/auth/auth.guard'
import { RolesGuard } from '../../common/auth/roles.guard'

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, AuthGuard, RolesGuard],
  exports: [AuthService, TokenService, AuthGuard, RolesGuard]
})
export class AuthModule {}
