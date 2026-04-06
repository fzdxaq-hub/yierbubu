import { defineStore } from 'pinia'
import type { AuthSessionPayload, AuthUser } from '@haodacai/shared'
import { getCurrentUser, login, logout } from '@/api/auth'
import { clearStoredSession, readStoredSession, updateStoredUser, writeStoredSession } from '@/lib/auth-storage'
import { setApiRequestAuthHandlers } from '@/lib/api-request'

let redirectToLoginHandler: ((redirectPath?: string) => void) | null = null
let handlersBound = false

export const useAdminAuthStore = defineStore('admin-auth', {
  state: () => ({
    user: null as AuthUser | null,
    accessToken: '',
    refreshToken: '',
    initialized: false
  }),
  getters: {
    isAuthenticated: (state) =>
      Boolean(
        state.user &&
          (state.user.role === 'merchant_admin' || state.user.role === 'super_admin') &&
          state.accessToken
      )
  },
  actions: {
    bindRequestHandlers() {
      if (handlersBound) {
        return
      }

      setApiRequestAuthHandlers({
        onSessionUpdate: (session) => {
          if (!session) {
            this.clearSessionState()
            return
          }

          this.applySession(session)
        },
        onUnauthorized: () => {
          this.clearSessionState()
          redirectToLoginHandler?.()
        }
      })

      handlersBound = true
    },

    applySession(session: AuthSessionPayload) {
      writeStoredSession(session)
      this.user = session.user
      this.accessToken = session.tokens.accessToken
      this.refreshToken = session.tokens.refreshToken
    },

    syncFromStorage() {
      const storedSession = readStoredSession()
      this.user = storedSession.user
      this.accessToken = storedSession.tokens?.accessToken ?? ''
      this.refreshToken = storedSession.tokens?.refreshToken ?? ''
    },

    clearSessionState() {
      clearStoredSession()
      this.user = null
      this.accessToken = ''
      this.refreshToken = ''
    },

    async initialize() {
      this.bindRequestHandlers()

      if (this.initialized) {
        return
      }

      this.syncFromStorage()

      if (!this.accessToken && !this.refreshToken) {
        this.initialized = true
        return
      }

      try {
        const currentUser = await getCurrentUser()

        if (currentUser.role !== 'merchant_admin' && currentUser.role !== 'super_admin') {
          throw new Error('当前账号不能登录管理端，请使用管理员账号。')
        }

        this.user = currentUser
        updateStoredUser(currentUser)
      } catch {
        this.clearSessionState()
      } finally {
        this.initialized = true
      }
    },

    async loginWithAccount(payload: { account: string; password: string }) {
      this.bindRequestHandlers()

      const session = await login(payload)

      if (session.user.role !== 'merchant_admin' && session.user.role !== 'super_admin') {
        this.clearSessionState()
        throw new Error('当前账号不是管理员账号，请前往用户端登录。')
      }

      this.applySession(session)
      this.initialized = true
      return session.user
    },

    async logoutCurrentAdmin() {
      try {
        if (this.accessToken) {
          await logout()
        }
      } finally {
        this.clearSessionState()
      }
    },

    setRedirectToLoginHandler(handler: (redirectPath?: string) => void) {
      redirectToLoginHandler = handler
      this.bindRequestHandlers()
    }
  }
})
