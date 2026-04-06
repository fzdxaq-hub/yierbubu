export interface ApiSuccessResponse<T> {
  success: true
  message: string
  data: T
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: unknown
  timestamp: string
  path: string
}

export const successResponse = <T>(data: T, message = '请求成功'): ApiSuccessResponse<T> => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
})
