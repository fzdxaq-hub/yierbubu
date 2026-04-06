import type { AuthSessionPayload } from '@haodacai/shared'
import { clearStoredSession, getStoredAccessToken, getStoredRefreshToken, writeStoredSession } from './auth-storage'

type QueryValue = string | number | boolean | null | undefined

interface ApiSuccessResponse<T> {
  success: true
  message: string
  data: T
  timestamp: string
}

export class ApiRequestError extends Error {
  status: number
  payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.payload = payload
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  baseURL?: string
  body?: BodyInit | Record<string, unknown> | null
  query?: Record<string, QueryValue>
  timeout?: number
  skipAuthRefresh?: boolean
}

interface SessionUpdateHandlers {
  onSessionUpdate?: (session: AuthSessionPayload | null) => void
  onUnauthorized?: () => void
}

const DEFAULT_TIMEOUT = 10000
const DEFAULT_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')
const AUTH_FREE_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh'])

let refreshPromise: Promise<string | null> | null = null
let sessionHandlers: SessionUpdateHandlers = {}

const buildUrl = (path: string, query?: Record<string, QueryValue>, baseURL = DEFAULT_BASE_URL) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${baseURL}${normalizedPath}`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }

      url.searchParams.set(key, String(value))
    })
  }

  return url.toString()
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]'

const isApiSuccessResponse = <T>(value: unknown): value is ApiSuccessResponse<T> =>
  isPlainObject(value) && value.success === true && 'data' in value

const parseResponsePayload = async (response: Response) => {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

const resolveErrorMessage = (response: Response, payload: unknown) =>
  typeof payload === 'object' && payload && 'message' in payload
    ? String((payload as { message: string }).message)
    : `请求失败（${response.status}）`

const buildRequestInit = (options: ApiRequestOptions, token?: string) => {
  const { body, headers, ...restOptions } = options
  const requestHeaders = new Headers(headers)
  let resolvedBody: BodyInit | null | undefined

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (isPlainObject(body)) {
    requestHeaders.set('Content-Type', 'application/json')
    resolvedBody = JSON.stringify(body)
  } else {
    resolvedBody = body
  }

  return {
    ...restOptions,
    body: resolvedBody,
    headers: requestHeaders
  }
}

const clearSessionAndNotify = () => {
  clearStoredSession()
  sessionHandlers.onSessionUpdate?.(null)
  sessionHandlers.onUnauthorized?.()
}

const refreshAccessToken = async (baseURL = DEFAULT_BASE_URL) => {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken()

    if (!refreshToken) {
      clearSessionAndNotify()
      return null
    }

    const response = await fetch(buildUrl('/auth/refresh', undefined, baseURL), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken
      })
    })

    const payload = await parseResponsePayload(response)

    if (!response.ok) {
      clearSessionAndNotify()
      throw new ApiRequestError(resolveErrorMessage(response, payload), response.status, payload)
    }

    const session = isApiSuccessResponse<AuthSessionPayload>(payload)
      ? payload.data
      : (payload as AuthSessionPayload)

    writeStoredSession(session)
    sessionHandlers.onSessionUpdate?.(session)

    return session.tokens.accessToken
  })()
    .catch((error) => {
      clearSessionAndNotify()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export const setApiRequestAuthHandlers = (handlers: SessionUpdateHandlers) => {
  sessionHandlers = handlers
}

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const {
    baseURL,
    query,
    timeout = DEFAULT_TIMEOUT,
    skipAuthRefresh = false,
    ...restOptions
  } = options

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)

  try {
    const shouldAttachAuth = !AUTH_FREE_PATHS.has(path)
    const token = shouldAttachAuth ? getStoredAccessToken() : ''
    const response = await fetch(buildUrl(path, query, baseURL), {
      ...buildRequestInit(restOptions, token),
      signal: controller.signal
    })

    const payload = await parseResponsePayload(response)

    if (response.status === 401 && shouldAttachAuth && !skipAuthRefresh) {
      try {
        const nextAccessToken = await refreshAccessToken(baseURL)

        if (nextAccessToken) {
          return apiRequest<T>(path, {
            ...options,
            skipAuthRefresh: true
          })
        }
      } catch (error) {
        if (error instanceof ApiRequestError) {
          throw error
        }
      }
    }

    if (!response.ok) {
      throw new ApiRequestError(resolveErrorMessage(response, payload), response.status, payload)
    }

    if (isApiSuccessResponse<T>(payload)) {
      return payload.data
    }

    return payload as T
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiRequestError('请求超时，请稍后重试。', 408)
    }

    throw new ApiRequestError(
      error instanceof Error ? error.message : '网络异常，请检查后端服务是否已启动。',
      500
    )
  } finally {
    window.clearTimeout(timer)
  }
}
