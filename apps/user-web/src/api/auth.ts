import type { AuthSessionPayload, AuthUser } from '@haodacai/shared'
import { request } from '@/lib/request'

export interface LoginPayload {
  account: string
  password: string
}

export interface RegisterPayload {
  account: string
  displayName: string
  password: string
}

export const register = (payload: RegisterPayload) =>
  request<AuthSessionPayload>('/auth/register', {
    method: 'POST',
    body: payload as unknown as Record<string, unknown>
  })

export const login = (payload: LoginPayload) =>
  request<AuthSessionPayload>('/auth/login', {
    method: 'POST',
    body: payload as unknown as Record<string, unknown>
  })

export const getCurrentUser = () => request<AuthUser>('/auth/me')

export const logout = () =>
  request<{ success: true }>('/auth/logout', {
    method: 'POST'
  })
