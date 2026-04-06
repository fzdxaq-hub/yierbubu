import type { Recipe as PrismaRecipe } from '@prisma/client'
import type { ProductListItem, Recipe } from '@haodacai/shared'

const normalizeTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) {
    return []
  }

  return tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
}

export const mapPrismaProduct = (product: PrismaRecipe): Recipe => ({
  id: product.id,
  shopId: product.shopId,
  categoryId: product.categoryId,
  name: product.name,
  badge: product.badge ?? undefined,
  cover: product.cover ?? undefined,
  rating: product.rating,
  price: product.price,
  sales: product.sales,
  stock: product.stock,
  isOnline: product.isOnline,
  tags: normalizeTags(product.tags),
  thumbTone: product.thumbTone,
  thumbAccent: product.thumbAccent,
  status: product.isOnline ? 'onShelf' : 'offShelf'
})

export const mapPrismaProductListItem = (product: PrismaRecipe, categoryName: string): ProductListItem => ({
  ...mapPrismaProduct(product),
  categoryName
})
