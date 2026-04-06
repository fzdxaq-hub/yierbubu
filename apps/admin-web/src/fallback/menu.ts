import type { MenuCategory, Recipe, RecipeFormInput, RecipeStatus, ShopInfo, ShopSummary } from '@/types/menu'

const palettes = [
  ['#f8d59c', '#d38852'],
  ['#f7c8cc', '#d38f95'],
  ['#f6e5a8', '#d3b148'],
  ['#d3efd9', '#78b487'],
  ['#d5e3ff', '#7c97cb'],
  ['#f4d9ff', '#b68ed6']
] as const

const fallbackShopId = 'bear-house'

const buildRecipes = (
  prefix: string,
  categoryId: string,
  names: string[],
  badgeLabel?: string
): Recipe[] =>
  names.map((name, index) => {
    const [thumbTone, thumbAccent] = palettes[index % palettes.length]
    const status: RecipeStatus = index % 4 === 0 ? 'offShelf' : 'onShelf'

    return {
      id: `${prefix}-${index + 1}`,
      shopId: fallbackShopId,
      categoryId,
      name,
      badge: index < 2 ? badgeLabel : undefined,
      cover: undefined,
      rating: index % 3 === 0 ? 5 : 4,
      price: index % 2 === 0 ? 0 : 8,
      sales: index * 3,
      stock: 999 - index * 24,
      isOnline: status === 'onShelf',
      tags: [],
      thumbTone,
      thumbAccent,
      status
    }
  })

export const defaultRecipeFormInput = (shopId: string, categoryId: string): RecipeFormInput => ({
  shopId,
  categoryId,
  name: '',
  badge: '',
  cover: '',
  rating: 5,
  price: 0,
  sales: 0,
  stock: 999,
  tags: [],
  status: 'onShelf'
})

export const fallbackShop: ShopInfo = {
  id: fallbackShopId,
  name: '熊熊小窝',
  subtitle: '情侣专属菜单空间',
  avatarLabel: '熊'
}

export const createFallbackCategories = (): MenuCategory[] => [
  {
    id: 'companion',
    name: '熊熊陪伴',
    sortOrder: 1,
    status: 'enabled',
    recipes: buildRecipes('companion', 'companion', ['哄睡', '按摩', '洗iojio', '亲亲', '牵手'], '已上架')
  },
  {
    id: 'coupon',
    name: '熊熊券',
    sortOrder: 2,
    status: 'enabled',
    recipes: buildRecipes('coupon', 'coupon', ['安慰券', '出去玩券', '奖励券', '马上哄我券', '和好券'], '限时')
  },
  {
    id: 'chef',
    name: '熊熊主厨',
    sortOrder: 3,
    status: 'enabled',
    recipes: buildRecipes('chef', 'chef', ['主厨笨蛋布布', '主厨一二大王'], '推荐')
  },
  {
    id: 'drink',
    name: '熊熊饮品',
    sortOrder: 4,
    status: 'enabled',
    recipes: buildRecipes('drink', 'drink', ['冰红茶', '东方树叶', '青提乌龙', '蜂蜜柚子茶'], '热卖')
  },
  {
    id: 'dessert',
    name: '熊熊甜品',
    sortOrder: 5,
    status: 'enabled',
    recipes: buildRecipes('dessert', 'dessert', ['草莓大福', '小熊布丁', '抹茶奶冻'])
  },
  {
    id: 'snack',
    name: '馋嘴一二',
    sortOrder: 6,
    status: 'enabled',
    recipes: buildRecipes('snack', 'snack', ['烤肠组合', '芝士薯球', '海苔脆脆'])
  },
  {
    id: 'meal',
    name: '熊熊觅食',
    sortOrder: 7,
    status: 'enabled',
    recipes: buildRecipes('meal', 'meal', ['熊熊饭团', '番茄肉酱面', '玉米浓汤'], '招牌')
  }
]

export const fallbackShopSummary: ShopSummary = {
  ...fallbackShop,
  categoryCount: 7,
  recipeCount: createFallbackCategories().reduce((sum, category) => sum + category.recipes.length, 0)
}
