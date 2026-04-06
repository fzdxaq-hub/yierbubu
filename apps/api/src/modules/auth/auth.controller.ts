import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { successResponse } from '../../common/http/api-response'
import { AuthGuard } from '../../common/auth/auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthUser } from '@haodacai/shared'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() payload: RegisterDto) {
    return successResponse(await this.authService.register(payload), '注册成功。')
  }

  @Post('login')
  async login(@Body() payload: LoginDto) {
    return successResponse(await this.authService.login(payload), '登录成功。')
  }

  @Post('refresh')
  async refresh(@Body() payload: RefreshTokenDto) {
    return successResponse(await this.authService.refresh(payload), '刷新登录状态成功。')
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser() user: AuthUser) {
    return successResponse(await this.authService.getCurrentUser(user), '获取当前用户成功。')
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@CurrentUser() user: AuthUser) {
    return successResponse(await this.authService.logout(user), '退出登录成功。')
  }
}
