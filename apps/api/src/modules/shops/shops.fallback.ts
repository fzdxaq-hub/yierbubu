import type { MenuCategory, Recipe, ShopInfo, ShopSummary } from '@haodacai/shared'

const palette = [
  ['#f8d59c', '#d38852'],
  ['#f7c8cc', '#d38f95'],
  ['#f6e5a8', '#d3b148'],
  ['#d3efd9', '#78b487'],
  ['#d5e3ff', '#7c97cb'],
  ['#f4d9ff', '#b68ed6']
] as const

export const fallbackShop: ShopInfo = {
  id: 'bear-house',
  name: '熊熊小窝',
  subtitle: '情侣专属菜单空间',
  avatarLabel: '熊'
}

const createRecipes = (categoryId: string, names: string[], badge?: string): Recipe[] =>
  names.map((name, index) => {
    const [thumbTone, thumbAccent] = palette[index % palette.length]
    const isOnline = index % 4 !== 0

    return {
      id: `${categoryId}-${index + 1}`,
      shopId: fallbackShop.id,
      categoryId,
      name,
      badge: index < 2 ? badge : undefined,
      cover: undefined,
      rating: index % 3 === 0 ? 5 : 4,
      price: index % 2 === 0 ? 0 : 8,
      sales: index * 3,
      stock: 999 - index * 24,
      isOnline,
      tags: badge ? [badge] : [],
      thumbTone,
      thumbAccent,
      status: isOnline ? 'onShelf' : 'offShelf'
    }
  })

export const fallbackCategories: MenuCategory[] = [
  {
    id: 'companion',
    name: '熊熊陪伴',
    sortOrder: 1,
    status: 'enabled',
    recipes: createRecipes('companion', ['哄睡', '按摩', '洗iojio', '亲亲', '牵手'], '已上架')
  },
  {
    id: 'coupon',
    name: '熊熊券',
    sortOrder: 2,
    status: 'enabled',
    recipes: createRecipes('coupon', ['安慰券', '出去玩券', '奖励券', '马上哄我券', '和好券'], '限时')
  },
  {
    id: 'chef',
    name: '熊熊主厨',
    sortOrder: 3,
    status: 'enabled',
    recipes: createRecipes('chef', ['主厨笨蛋布布', '主厨一二大王'], '推荐')
  },
  {
    id: 'drink',
    name: '熊熊饮品',
    sortOrder: 4,
    status: 'enabled',
    recipes: createRecipes('drink', ['冰红茶', '东方树叶', '青提乌龙', '蜂蜜柚子茶'], '热卖')
  },
  {
    id: 'dessert',
    name: '熊熊甜品',
    sortOrder: 5,
    status: 'enabled',
    recipes: createRecipes('dessert', ['草莓大福', '小熊布丁', '抹茶奶冻'])
  },
  {
    id: 'snack',
    name: '馋嘴一二',
    sortOrder: 6,
    status: 'enabled',
    recipes: createRecipes('snack', ['烤肠组合', '芝士薯球', '海苔脆脆'])
  },
  {
    id: 'meal',
    name: '熊熊觅食',
    sortOrder: 7,
    status: 'enabled',
    recipes: createRecipes('meal', ['熊熊饭团', '番茄肉酱面', '玉米浓汤'], '招牌')
  }
]

export const fallbackShopSummary: ShopSummary = {
  ...fallbackShop,
  categoryCount: fallbackCategories.length,
  recipeCount: fallbackCategories.reduce((sum, category) => sum + category.recipes.length, 0)
}
