import type { Recipe, ShopInfo } from '@haodacai/shared'

export interface ShopCard extends ShopInfo {
  theme: string
  coverLabel: string
}

const palette = [
  ['#ffe0b5', '#d99558'],
  ['#fce5b7', '#d5b152'],
  ['#f8d9d9', '#d59696']
] as const

const createRecipe = (id: string, categoryId: string, name: string, index: number): Recipe => ({
  id,
  shopId: 'bear-house',
  categoryId,
  name,
  cover: undefined,
  rating: 5,
  price: 9 + index,
  sales: 32 + index * 4,
  stock: 60 - index * 3,
  isOnline: true,
  tags: [],
  thumbTone: palette[index % palette.length][0],
  thumbAccent: palette[index % palette.length][1],
  status: 'onShelf',
  badge: index === 0 ? '推荐' : undefined
})

export const featuredShops: ShopCard[] = [
  {
    id: 'bear-house',
    name: '熊熊小窝',
    subtitle: '情侣限定治愈菜谱',
    avatarLabel: '熊',
    theme: 'forest',
    coverLabel: '今日热卖'
  },
  {
    id: 'tea-house',
    name: '树叶饮品屋',
    subtitle: '清爽茶饮和小食',
    avatarLabel: '茶',
    theme: 'tea',
    coverLabel: '新品上架'
  }
]

export const featuredRecipes: Recipe[] = [
  createRecipe('recipe-1', 'companion', '哄睡套餐', 0),
  createRecipe('recipe-2', 'drink', '冰红茶', 1),
  createRecipe('recipe-3', 'meal', '熊熊饭团', 2)
]
