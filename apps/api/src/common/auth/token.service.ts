import { Injectable, UnauthorizedException } from '@nestjs/common'
import type { AuthTokens, AuthUser, UserRole } from '@haodacai/shared'
import { createHmac, timingSafeEqual } from 'crypto'

type TokenType = 'access' | 'refresh'

interface TokenPayload {
  sub: string
  role: UserRole
  account: string
  shopId?: string
  type: TokenType
  iat: number
  exp: number
}

const TOKEN_HEADER = {
  alg: 'HS256',
  typ: 'JWT'
}

const base64UrlEncode = (value: string) => Buffer.from(value).toString('base64url')

const parseJson = <T>(value: string, fallbackMessage: string): T => {
  try {
    return JSON.parse(value) as T
  } catch {
    throw new UnauthorizedException(fallbackMessage)
  }
}

@Injectable()
export class TokenService {
  private readonly accessSecret = process.env.JWT_SECRET ?? 'haodacai-local-dev-access-secret'
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'haodacai-local-dev-refresh-secret'
  private readonly accessTokenTtlSeconds = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 60 * 30)
  private readonly refreshTokenTtlSeconds = Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 60 * 60 * 24 * 7)

  private sign(input: string, secret: string) {
    return createHmac('sha256', secret).update(input).digest('base64url')
  }

  private buildToken(user: AuthUser, type: TokenType, expiresInSeconds: number) {
    const issuedAt = Math.floor(Date.now() / 1000)
    const payload: TokenPayload = {
      sub: user.id,
      role: user.role,
      account: user.account,
      shopId: user.shopId,
      type,
      iat: issuedAt,
      exp: issuedAt + expiresInSeconds
    }

    const encodedHeader = base64UrlEncode(JSON.stringify(TOKEN_HEADER))
    const encodedPayload = base64UrlEncode(JSON.stringify(payload))
    const content = `${encodedHeader}.${encodedPayload}`
    const secret = type === 'refresh' ? this.refreshSecret : this.accessSecret
    const signature = this.sign(content, secret)

    return {
      token: `${content}.${signature}`,
      expiresAt: new Date(payload.exp * 1000).toISOString()
    }
  }

  issueTokens(user: AuthUser): AuthTokens {
    const access = this.buildToken(user, 'access', this.accessTokenTtlSeconds)
    const refresh = this.buildToken(user, 'refresh', this.refreshTokenTtlSeconds)

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshTokenExpiresAt: refresh.expiresAt
    }
  }

  verifyToken(token: string, expectedType?: TokenType) {
    const segments = token.split('.')

    if (segments.length !== 3) {
      throw new UnauthorizedException('登录状态无效，请重新登录。')
    }

    const [encodedHeader, encodedPayload, signature] = segments
    const content = `${encodedHeader}.${encodedPayload}`
    const payload = parseJson<TokenPayload>(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      '登录状态无效，请重新登录。'
    )
    const secret = payload.type === 'refresh' ? this.refreshSecret : this.accessSecret
    const expectedSignature = this.sign(content, secret)

    if (
      expectedSignature.length !== signature.length ||
      !timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
    ) {
      throw new UnauthorizedException('登录状态无效，请重新登录。')
    }

    const header = parseJson<{ alg?: string; typ?: string }>(
      Buffer.from(encodedHeader, 'base64url').toString('utf8'),
      '登录状态无效，请重新登录。'
    )

    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new UnauthorizedException('登录状态无效，请重新登录。')
    }

    if (expectedType && payload.type !== expectedType) {
      throw new UnauthorizedException('登录状态无效，请重新登录。')
    }

    if (!payload.sub || !payload.role || !payload.account) {
      throw new UnauthorizedException('登录状态无效，请重新登录。')
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('登录已过期，请重新登录。')
    }

    return payload
  }
}
