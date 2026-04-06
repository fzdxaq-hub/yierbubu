import type { AuthSessionPayload, AuthUser } from '@haodacai/shared'
import { apiRequest } from '@/lib/api-request'

export interface LoginPayload {
  account: string
  password: string
}

export const login = (payload: LoginPayload) =>
  apiRequest<AuthSessionPayload>('/auth/login', {
    method: 'POST',
    body: payload as unknown as Record<string, unknown>
  })

export const getCurrentUser = () => apiRequest<AuthUser>('/auth/me')

export const logout = () =>
  apiRequest<{ success: true }>('/auth/logout', {
    method: 'POST'
  })
