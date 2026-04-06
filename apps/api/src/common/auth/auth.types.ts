import type { AuthUser } from '@haodacai/shared'

export interface RequestWithUser {
  headers: {
    authorization?: string
  }
  user?: AuthUser
}
