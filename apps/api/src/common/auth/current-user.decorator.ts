import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AuthUser } from '@haodacai/shared'
import type { RequestWithUser } from './auth.types'

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthUser => {
  const request = context.switchToHttp().getRequest<RequestWithUser>()

  return request.user as AuthUser
})
