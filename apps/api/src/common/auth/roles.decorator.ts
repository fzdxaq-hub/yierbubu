import type { UserRole } from '@haodacai/shared'
import { SetMetadata } from '@nestjs/common'

export const ROLES_METADATA_KEY = 'roles'

export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_METADATA_KEY, roles)
