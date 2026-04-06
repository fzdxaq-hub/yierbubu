import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import type { AuthUser, UserRole } from '@haodacai/shared'
import { PrismaService } from '../../common/prisma/prisma.service'
import { hashSecret, verifySecret } from '../../common/auth/password'
import type { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client'

const normalizeAccount = (value: string) => value.trim().toLowerCase()

const toSharedRole = (role: PrismaUserRole): UserRole => {
  switch (role) {
    case 'MERCHANT_ADMIN':
      return 'merchant_admin'
    case 'SUPER_ADMIN':
      return 'super_admin'
    default:
      return 'end_user'
  }
}

const toPrismaRole = (role: UserRole): PrismaUserRole => {
  switch (role) {
    case 'merchant_admin':
      return 'MERCHANT_ADMIN'
    case 'super_admin':
      return 'SUPER_ADMIN'
    default:
      return 'END_USER'
  }
}

const toAuthUser = (user: PrismaUser): AuthUser => ({
  id: user.id,
  account: user.account,
  displayName: user.displayName,
  role: toSharedRole(user.role),
  shopId: user.shopId ?? undefined
})

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id
      }
    })
  }

  async findByAccount(account: string) {
    return this.prisma.user.findUnique({
      where: {
        account: normalizeAccount(account)
      }
    })
  }

  async getUserProfileById(id: string): Promise<AuthUser> {
    const user = await this.findById(id)

    if (!user) {
      throw new UnauthorizedException('当前登录账号不存在，请重新登录。')
    }

    return toAuthUser(user)
  }

  async createUser(payload: {
    account: string
    displayName: string
    password: string
    role?: UserRole
    shopId?: string
  }) {
    const account = normalizeAccount(payload.account)

    if (!account) {
      throw new BadRequestException('账号不能为空。')
    }

    const existingUser = await this.findByAccount(account)

    if (existingUser) {
      throw new BadRequestException('该账号已存在。')
    }

    const created = await this.prisma.user.create({
      data: {
        account,
        displayName: payload.displayName.trim() || account,
        passwordHash: hashSecret(payload.password),
        role: toPrismaRole(payload.role ?? 'end_user'),
        shopId: payload.shopId ?? null
      }
    })

    return toAuthUser(created)
  }

  async validateCredentials(account: string, password: string) {
    const user = await this.findByAccount(account)

    if (!user || !verifySecret(password, user.passwordHash)) {
      throw new UnauthorizedException('账号或密码错误。')
    }

    return user
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        refreshTokenHash: hashSecret(refreshToken)
      }
    })
  }

  async verifyRefreshToken(userId: string, refreshToken: string) {
    const user = await this.findById(userId)

    if (!user) {
      throw new NotFoundException('账号不存在。')
    }

    if (!verifySecret(refreshToken, user.refreshTokenHash)) {
      throw new UnauthorizedException('刷新令牌无效，请重新登录。')
    }

    return user
  }

  async clearRefreshToken(userId: string) {
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        refreshTokenHash: null
      }
    })
  }

  toAuthUser(user: PrismaUser) {
    return toAuthUser(user)
  }
}
