import { Injectable } from '@nestjs/common'
import type { AuthSessionPayload, AuthUser } from '@haodacai/shared'
import { TokenService } from '../../common/auth/token.service'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService
  ) {}

  private async createSession(user: AuthUser): Promise<AuthSessionPayload> {
    const tokens = this.tokenService.issueTokens(user)
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken)

    return {
      user,
      tokens
    }
  }

  async register(payload: RegisterDto) {
    const user = await this.usersService.createUser({
      account: payload.account,
      displayName: payload.displayName,
      password: payload.password,
      role: 'end_user'
    })

    return this.createSession(user)
  }

  async login(payload: LoginDto) {
    const user = await this.usersService.validateCredentials(payload.account, payload.password)
    return this.createSession(this.usersService.toAuthUser(user))
  }

  async refresh(payload: RefreshTokenDto) {
    const claims = this.tokenService.verifyToken(payload.refreshToken, 'refresh')
    const user = await this.usersService.verifyRefreshToken(claims.sub, payload.refreshToken)

    return this.createSession(this.usersService.toAuthUser(user))
  }

  async logout(user: AuthUser) {
    await this.usersService.clearRefreshToken(user.id)

    return {
      success: true
    }
  }

  async getCurrentUser(user: AuthUser) {
    return this.usersService.getUserProfileById(user.id)
  }
}
