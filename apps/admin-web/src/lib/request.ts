type QueryValue = string | number | boolean | null | undefined

export class RequestError extends Error {
  status: number
  payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'RequestError'
    this.status = status
    this.payload = payload
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  baseURL?: string
  body?: BodyInit | Record<string, unknown> | null
  query?: Record<string, QueryValue>
  timeout?: number
}

const DEFAULT_TIMEOUT = 10000
const DEFAULT_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

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

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const {
    baseURL,
    body,
    headers,
    query,
    timeout = DEFAULT_TIMEOUT,
    ...restOptions
  } = options

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  const requestHeaders = new Headers(headers)
  let resolvedBody: BodyInit | null | undefined

  if (isPlainObject(body)) {
    requestHeaders.set('Content-Type', 'application/json')
    resolvedBody = JSON.stringify(body)
  } else {
    resolvedBody = body
  }

  try {
    const response = await fetch(buildUrl(path, query, baseURL), {
      ...restOptions,
      body: resolvedBody,
      headers: requestHeaders,
      signal: controller.signal
    })

    const payload = await parseResponsePayload(response)

    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload && 'message' in payload
          ? String((payload as { message: string }).message)
          : `请求失败（${response.status}）`

      throw new RequestError(message, response.status, payload)
    }

    return payload as T
  } catch (error) {
    if (error instanceof RequestError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RequestError('请求超时，请稍后重试。', 408)
    }

    throw new RequestError(
      error instanceof Error ? error.message : '网络异常，请检查后端服务是否启动。',
      500
    )
  } finally {
    window.clearTimeout(timer)
  }
}
