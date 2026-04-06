import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { RequestWithUser } from './auth.types'
import { UsersService } from '../../modules/users/users.service'
import { TokenService } from './token.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const authorization = request.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录。')
    }

    const token = authorization.slice('Bearer '.length).trim()

    if (!token) {
      throw new UnauthorizedException('请先登录。')
    }

    const payload = this.tokenService.verifyToken(token, 'access')
    const user = await this.usersService.getUserProfileById(payload.sub)

    request.user = user

    return true
  }
}
