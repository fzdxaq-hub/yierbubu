export const userRoleValues = {
  endUser: 'end_user',
  merchantAdmin: 'merchant_admin',
  superAdmin: 'super_admin'
} as const

export type UserRole = (typeof userRoleValues)[keyof typeof userRoleValues]

export interface AuthUser {
  id: string
  account: string
  displayName: string
  role: UserRole
  shopId?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
}

export interface AuthSessionPayload {
  user: AuthUser
  tokens: AuthTokens
}
