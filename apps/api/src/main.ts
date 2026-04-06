import 'dotenv/config'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/http/http-exception.filter'

const logger = new Logger('Bootstrap')

const parseCorsOrigins = (value?: string) => {
  if (!value || !value.trim()) {
    return ['http://localhost:5174', 'http://localhost:5175']
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const port = Number(process.env.PORT ?? 3000)
  const host = process.env.HOST ?? '0.0.0.0'
  const corsOrigins = parseCorsOrigins(process.env.CORS_ALLOW_ORIGINS)

  const app = await NestFactory.create(AppModule, {
    logger:
      nodeEnv === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose']
  })

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS origin not allowed: ${origin}`), false)
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  )
  app.useGlobalFilters(new HttpExceptionFilter())

  await app.listen(port, host)

  logger.log(`API ready at http://${host}:${port}/api`)
  logger.log(`CORS allow origins: ${corsOrigins.join(', ')}`)
}

void bootstrap()
