import type { AuthSessionPayload, AuthTokens, AuthUser } from '@haodacai/shared'

const STORAGE_KEY = 'haodacai-user-auth'

interface StoredAuthSession {
  user: AuthUser | null
  tokens: AuthTokens | null
}

const emptySession = (): StoredAuthSession => ({
  user: null,
  tokens: null
})

export const readStoredSession = (): StoredAuthSession => {
  const rawValue = window.localStorage.getItem(STORAGE_KEY)

  if (!rawValue) {
    return emptySession()
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredAuthSession
    return {
      user: parsed.user ?? null,
      tokens: parsed.tokens ?? null
    }
  } catch {
    return emptySession()
  }
}

export const writeStoredSession = (session: AuthSessionPayload) => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      user: session.user,
      tokens: session.tokens
    })
  )
}

export const updateStoredUser = (user: AuthUser) => {
  const current = readStoredSession()

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      user,
      tokens: current.tokens
    })
  )
}

export const clearStoredSession = () => {
  window.localStorage.removeItem(STORAGE_KEY)
}

export const getStoredAccessToken = () => readStoredSession().tokens?.accessToken ?? ''

export const getStoredRefreshToken = () => readStoredSession().tokens?.refreshToken ?? ''
