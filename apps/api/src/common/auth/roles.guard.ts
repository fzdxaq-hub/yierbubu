import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { UserRole } from '@haodacai/shared'
import type { RequestWithUser } from './auth.types'
import { ROLES_METADATA_KEY } from './roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_METADATA_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const currentUserRole = request.user?.role

    if (!currentUserRole || !requiredRoles.includes(currentUserRole)) {
      throw new ForbiddenException('当前账号无权访问该接口。')
    }

    return true
  }
}
