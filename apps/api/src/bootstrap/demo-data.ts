import { CategoryStatus, UserRole, type PrismaClient, type User } from '@prisma/client'
import { hashSecret, verifySecret } from '../common/auth/password'

const demoShopId = 'bear-house'
const demoPassword = 'Demo123456'

const demoUsers = [
  {
    account: 'end_user_demo',
    displayName: '演示用户',
    password: demoPassword,
    role: UserRole.END_USER,
    shopId: null
  },
  {
    account: 'merchant_admin_demo',
    displayName: '演示商家管理员',
    password: demoPassword,
    role: UserRole.MERCHANT_ADMIN,
    shopId: demoShopId
  },
  {
    account: 'super_admin_demo',
    displayName: '演示超级管理员',
    password: demoPassword,
    role: UserRole.SUPER_ADMIN,
    shopId: null
  }
] as const

const palette = [
  ['#f8d59c', '#d38852'],
  ['#f7c8cc', '#d38f95'],
  ['#f6e5a8', '#d3b148'],
  ['#d3efd9', '#78b487'],
  ['#d5e3ff', '#7c97cb'],
  ['#f4d9ff', '#b68ed6']
] as const

const demoCategories = [
  {
    name: '熊熊陪伴',
    sortOrder: 1,
    badge: '已上架',
    recipes: ['哄睡', '按摩', '洗iojio', '亲亲', '牵手']
  },
  {
    name: '熊熊券',
    sortOrder: 2,
    badge: '限时',
    recipes: ['安慰券', '出去玩券', '奖励券', '马上哄我券', '和好券']
  },
  {
    name: '熊熊主厨',
    sortOrder: 3,
    badge: '推荐',
    recipes: ['主厨笨蛋布布', '主厨一二大王']
  },
  {
    name: '熊熊饮品',
    sortOrder: 4,
    badge: '热卖',
    recipes: ['冰红茶', '东方树叶', '青提乌龙', '蜂蜜柚子茶']
  },
  {
    name: '熊熊甜品',
    sortOrder: 5,
    badge: null,
    recipes: ['草莓大福', '小熊布丁', '抹茶奶冻']
  },
  {
    name: '馋嘴一二',
    sortOrder: 6,
    badge: null,
    recipes: ['烤肠组合', '芝士薯球', '海苔脆脆']
  },
  {
    name: '熊熊觅食',
    sortOrder: 7,
    badge: '招牌',
    recipes: ['熊熊饭团', '番茄肉酱面', '玉米浓汤']
  }
] as const

export const getDemoSeedMode = () => process.env.SEED_MODE ?? 'demo'

export const isDemoSeedAllowed = () =>
  getDemoSeedMode() !== 'production' || process.env.ALLOW_PRODUCTION_SEED === 'true'

export const assertDemoSeedAllowed = () => {
  if (!isDemoSeedAllowed()) {
    throw new Error(
      'Demo seed is disabled when SEED_MODE=production. Set ALLOW_PRODUCTION_SEED=true for a demo deployment.'
    )
  }
}

const demoAccounts = () => demoUsers.map((user) => user.account)

const buildRecipeData = (shopId: string, categoryId: string, name: string, index: number, badge: string | null) => ({
  shopId,
  categoryId,
  name,
  badge: index < 2 ? badge : null,
  cover: null,
  rating: index % 3 === 0 ? 5 : 4,
  price: index % 2 === 0 ? 0 : 8,
  sales: index * 3,
  stock: 999 - index * 24,
  isOnline: index % 4 !== 0,
  tags: badge ? [badge] : [],
  thumbTone: palette[index % palette.length][0],
  thumbAccent: palette[index % palette.length][1]
})

const resolvePasswordHash = (user: User | null, password: string) => {
  if (user && verifySecret(password, user.passwordHash)) {
    return user.passwordHash
  }

  return hashSecret(password)
}

const ensureDemoUser = async (prisma: PrismaClient, user: (typeof demoUsers)[number]) => {
  const existing = await prisma.user.findUnique({
    where: {
      account: user.account
    }
  })

  const passwordHash = resolvePasswordHash(existing, user.password)

  await prisma.user.upsert({
    where: {
      account: user.account
    },
    update: {
      displayName: user.displayName,
      passwordHash,
      role: user.role,
      shopId: user.shopId
    },
    create: {
      account: user.account,
      displayName: user.displayName,
      passwordHash,
      refreshTokenHash: null,
      role: user.role,
      shopId: user.shopId
    }
  })
}

const ensureDemoCatalog = async (prisma: PrismaClient) => {
  const shop = await prisma.shop.upsert({
    where: {
      id: demoShopId
    },
    update: {},
    create: {
      id: demoShopId,
      name: '熊熊小窝',
      subtitle: '情侣专属菜单空间',
      avatarLabel: '熊'
    }
  })

  for (const category of demoCategories) {
    const existingCategory = await prisma.menuCategory.findFirst({
      where: {
        shopId: shop.id,
        sortOrder: category.sortOrder
      }
    })

    const resolvedCategory =
      existingCategory ??
      (await prisma.menuCategory.create({
        data: {
          shopId: shop.id,
          name: category.name,
          sortOrder: category.sortOrder,
          status: CategoryStatus.ENABLED
        }
      }))

    for (const [index, recipeName] of category.recipes.entries()) {
      const existingRecipe = await prisma.recipe.findFirst({
        where: {
          shopId: shop.id,
          categoryId: resolvedCategory.id,
          name: recipeName
        }
      })

      if (!existingRecipe) {
        await prisma.recipe.create({
          data: buildRecipeData(shop.id, resolvedCategory.id, recipeName, index, category.badge)
        })
      }
    }
  }
}

export const resetDemoData = async (prisma: PrismaClient) => {
  const users = await prisma.user.findMany({
    where: {
      account: {
        in: demoAccounts()
      }
    },
    select: {
      id: true
    }
  })
  const userIds = users.map((user) => user.id)

  await prisma.orderItem.deleteMany({
    where: {
      order: {
        OR: [{ shopId: demoShopId }, { userId: { in: userIds } }]
      }
    }
  })
  await prisma.order.deleteMany({
    where: {
      OR: [{ shopId: demoShopId }, { userId: { in: userIds } }]
    }
  })
  await prisma.cartItem.deleteMany({
    where: {
      OR: [{ shopId: demoShopId }, { cart: { userId: { in: userIds } } }]
    }
  })
  await prisma.cart.deleteMany({
    where: {
      OR: [{ shopId: demoShopId }, { userId: { in: userIds } }]
    }
  })
  await prisma.recipe.deleteMany({
    where: {
      shopId: demoShopId
    }
  })
  await prisma.menuCategory.deleteMany({
    where: {
      shopId: demoShopId
    }
  })
  await prisma.shop.deleteMany({
    where: {
      id: demoShopId
    }
  })
  await prisma.user.deleteMany({
    where: {
      account: {
        in: demoAccounts()
      }
    }
  })
}

export const ensureDemoData = async (prisma: PrismaClient) => {
  await ensureDemoCatalog(prisma)

  for (const user of demoUsers) {
    await ensureDemoUser(prisma, user)
  }
}
