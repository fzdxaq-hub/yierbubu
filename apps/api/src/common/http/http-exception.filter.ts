import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import type { ApiErrorResponse } from './api-response'

interface RequestLike {
  url: string
}

interface ResponseLike {
  status(code: number): ResponseLike
  json(payload: ApiErrorResponse): void
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<ResponseLike>()
    const request = ctx.getRequest<RequestLike>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null

    let message = '服务端发生异常，请稍后重试。'
    let errors: unknown = undefined

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const candidate = exceptionResponse as { message?: string | string[]; error?: string }

      if (Array.isArray(candidate.message)) {
        message = '请求参数校验失败。'
        errors = candidate.message
      } else if (typeof candidate.message === 'string') {
        message = candidate.message
      } else if (typeof candidate.error === 'string') {
        message = candidate.error
      }
    } else if (exception instanceof Error && exception.message) {
      message = exception.message
    }

    const payload: ApiErrorResponse = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url
    }

    response.status(status).json(payload)
  }
}
