import { computed, reactive, readonly } from 'vue'
import type { AuthSessionPayload, AuthUser } from '@haodacai/shared'
import { getCurrentUser, login, logout, register } from '@/api/auth'
import { clearStoredSession, readStoredSession, updateStoredUser, writeStoredSession } from '@/lib/auth-storage'
import { setRequestAuthHandlers } from '@/lib/request'

interface AuthState {
  user: AuthUser | null
  accessToken: string
  refreshToken: string
  initialized: boolean
}

const state = reactive<AuthState>({
  user: null,
  accessToken: '',
  refreshToken: '',
  initialized: false
})

let initializePromise: Promise<void> | null = null
let redirectToLoginHandler: ((redirectPath?: string) => void) | null = null

const applySession = (session: AuthSessionPayload) => {
  writeStoredSession(session)
  state.user = session.user
  state.accessToken = session.tokens.accessToken
  state.refreshToken = session.tokens.refreshToken
}

const syncFromStorage = () => {
  const storedSession = readStoredSession()
  state.user = storedSession.user
  state.accessToken = storedSession.tokens?.accessToken ?? ''
  state.refreshToken = storedSession.tokens?.refreshToken ?? ''
}

const clearSessionState = () => {
  clearStoredSession()
  state.user = null
  state.accessToken = ''
  state.refreshToken = ''
}

setRequestAuthHandlers({
  onSessionUpdate: (session) => {
    if (!session) {
      clearSessionState()
      return
    }

    applySession(session)
  },
  onUnauthorized: () => {
    clearSessionState()
    redirectToLoginHandler?.()
  }
})

export const useAuthStore = () => {
  const isAuthenticated = computed(
    () => Boolean(state.user && state.user.role === 'end_user' && state.accessToken)
  )

  const initialize = async () => {
    if (state.initialized) {
      return
    }

    if (initializePromise) {
      return initializePromise
    }

    initializePromise = (async () => {
      syncFromStorage()

      if (!state.accessToken && !state.refreshToken) {
        state.initialized = true
        return
      }

      try {
        const currentUser = await getCurrentUser()

        if (currentUser.role !== 'end_user') {
          throw new Error('当前账号不能登录用户端，请前往管理端登录。')
        }

        state.user = currentUser
        updateStoredUser(currentUser)
      } catch {
        clearSessionState()
      } finally {
        state.initialized = true
      }
    })().finally(() => {
      initializePromise = null
    })

    return initializePromise
  }

  const loginWithAccount = async (payload: { account: string; password: string }) => {
    const session = await login(payload)

    if (session.user.role !== 'end_user') {
      clearSessionState()
      throw new Error('当前账号不是用户端账号，请前往管理端登录。')
    }

    applySession(session)
    state.initialized = true
    return session.user
  }

  const registerEndUser = async (payload: { account: string; displayName: string; password: string }) => {
    const session = await register(payload)

    applySession(session)
    state.initialized = true
    return session.user
  }

  const logoutCurrentUser = async () => {
    try {
      if (state.accessToken) {
        await logout()
      }
    } finally {
      clearSessionState()
    }
  }

  const setRedirectToLoginHandler = (handler: (redirectPath?: string) => void) => {
    redirectToLoginHandler = handler
  }

  return {
    state: readonly(state),
    isAuthenticated,
    initialize,
    loginWithAccount,
    registerEndUser,
    logoutCurrentUser,
    clearSessionState,
    setRedirectToLoginHandler
  }
}
