import 'dotenv/config'
import { PrismaClient, CategoryStatus, UserRole } from '@prisma/client'
import { hashSecret } from '../src/common/auth/password'

const prisma = new PrismaClient()
const seedMode = process.env.SEED_MODE ?? 'development'
const allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true'

const palette = [
  ['#f8d59c', '#d38852'],
  ['#f7c8cc', '#d38f95'],
  ['#f6e5a8', '#d3b148'],
  ['#d3efd9', '#78b487'],
  ['#d5e3ff', '#7c97cb'],
  ['#f4d9ff', '#b68ed6']
] as const

const shopId = 'bear-house'

const seedUsers = [
  {
    account: 'end_user_demo',
    displayName: '演示用户',
    password: 'Demo123456',
    role: UserRole.END_USER,
    shopId: null
  },
  {
    account: 'merchant_admin_demo',
    displayName: '演示商家管理员',
    password: 'Demo123456',
    role: UserRole.MERCHANT_ADMIN,
    shopId
  },
  {
    account: 'super_admin_demo',
    displayName: '演示超级管理员',
    password: 'Demo123456',
    role: UserRole.SUPER_ADMIN,
    shopId: null
  }
] as const

const categories = [
  { name: '熊熊陪伴', sortOrder: 1, badge: '已上架', recipes: ['哄睡', '按摩', '洗iojio', '亲亲', '牵手'] },
  { name: '熊熊券', sortOrder: 2, badge: '限时', recipes: ['安慰券', '出去玩券', '奖励券', '马上哄我券', '和好券'] },
  { name: '熊熊主厨', sortOrder: 3, badge: '推荐', recipes: ['主厨笨蛋布布', '主厨一二大王'] },
  { name: '熊熊饮品', sortOrder: 4, badge: '热卖', recipes: ['冰红茶', '东方树叶', '青提乌龙', '蜂蜜柚子茶'] },
  { name: '熊熊甜品', sortOrder: 5, badge: null, recipes: ['草莓大福', '小熊布丁', '抹茶奶冻'] },
  { name: '馋嘴一二', sortOrder: 6, badge: null, recipes: ['烤肠组合', '芝士薯球', '海苔脆脆'] },
  { name: '熊熊觅食', sortOrder: 7, badge: '招牌', recipes: ['熊熊饭团', '番茄肉酱面', '玉米浓汤'] }
] as const

const createRecipes = (resolvedShopId: string, categoryId: string, names: string[], badge?: string) =>
  names.map((name, index) => ({
    shopId: resolvedShopId,
    categoryId,
    name,
    badge: index < 2 ? badge ?? null : null,
    cover: null,
    rating: index % 3 === 0 ? 5 : 4,
    price: index % 2 === 0 ? 0 : 8,
    sales: index * 3,
    stock: 999 - index * 24,
    isOnline: index % 4 !== 0,
    tags: badge ? [badge] : [],
    thumbTone: palette[index % palette.length][0],
    thumbAccent: palette[index % palette.length][1]
  }))

const assertSeedMode = () => {
  if (seedMode === 'production' && !allowProductionSeed) {
    throw new Error('生产环境默认禁止写入演示 seed。若确需演示环境初始化，请显式设置 ALLOW_PRODUCTION_SEED=true。')
  }
}

async function resetDemoData() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.recipe.deleteMany()
  await prisma.menuCategory.deleteMany()
  await prisma.shop.deleteMany()
  await prisma.user.deleteMany({
    where: {
      account: {
        in: seedUsers.map((user) => user.account)
      }
    }
  })
}

async function seedCatalogAndAccounts() {
  const shop = await prisma.shop.create({
    data: {
      id: shopId,
      name: '熊熊小窝',
      subtitle: '情侣专属菜单空间',
      avatarLabel: '熊'
    }
  })

  for (const category of categories) {
    const createdCategory = await prisma.menuCategory.create({
      data: {
        shopId: shop.id,
        name: category.name,
        sortOrder: category.sortOrder,
        status: CategoryStatus.ENABLED
      }
    })

    await prisma.recipe.createMany({
      data: createRecipes(shop.id, createdCategory.id, [...category.recipes], category.badge ?? undefined)
    })
  }

  for (const user of seedUsers) {
    await prisma.user.create({
      data: {
        account: user.account,
        displayName: user.displayName,
        passwordHash: hashSecret(user.password),
        refreshTokenHash: null,
        role: user.role,
        shopId: user.shopId
      }
    })
  }
}

async function main() {
  assertSeedMode()

  console.log(`[seed] start with mode=${seedMode}`)

  await resetDemoData()
  await seedCatalogAndAccounts()

  console.log('[seed] demo catalog and demo accounts are ready')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
