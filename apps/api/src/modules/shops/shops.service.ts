import { Injectable, NotFoundException } from '@nestjs/common'
import { CategoryStatus as PrismaCategoryStatus, type MenuCategory as PrismaMenuCategory, type Recipe as PrismaRecipe, type Shop as PrismaShop } from '@prisma/client'
import type { CategorySummary, MenuCategory, ProductListItem, ShopInfo, ShopMenuPayload, ShopSummary } from '@haodacai/shared'
import { PrismaService } from '../../common/prisma/prisma.service'
import { mapPrismaProduct, mapPrismaProductListItem } from '../products/products.mapper'
import { fallbackCategories, fallbackShop, fallbackShopSummary } from './shops.fallback'

type PrismaCategoryWithRecipes = PrismaMenuCategory & { recipes: PrismaRecipe[] }

const mapCategoryStatus = (status: PrismaCategoryStatus): MenuCategory['status'] =>
  status === PrismaCategoryStatus.ENABLED ? 'enabled' : 'disabled'

const mapShop = (shop: PrismaShop): ShopInfo => ({
  id: shop.id,
  name: shop.name,
  subtitle: shop.subtitle,
  avatarLabel: shop.avatarLabel
})

const mapCategory = (category: PrismaCategoryWithRecipes): MenuCategory => ({
  id: category.id,
  name: category.name,
  sortOrder: category.sortOrder,
  status: mapCategoryStatus(category.status),
  recipes: category.recipes.map(mapPrismaProduct)
})

const toShopSummary = (shop: ShopInfo, categories: MenuCategory[]): ShopSummary => ({
  ...shop,
  categoryCount: categories.length,
  recipeCount: categories.reduce((sum, category) => sum + category.recipes.length, 0)
})

const toCategorySummary = (category: MenuCategory): CategorySummary => ({
  id: category.id,
  name: category.name,
  sortOrder: category.sortOrder,
  status: category.status,
  recipeCount: category.recipes.length
})

const toProductList = (categories: MenuCategory[]): ProductListItem[] =>
  categories.flatMap((category) => category.recipes.map((recipe) => ({ ...recipe, categoryName: category.name })))

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveShop(): Promise<ShopSummary> {
    const shops = await this.getShopSummaries()
    return shops[0] ?? fallbackShopSummary
  }

  async getShopSummaries(): Promise<ShopSummary[]> {
    try {
      const shops = await this.prisma.shop.findMany({
        include: {
          categories: {
            include: {
              recipes: true
            }
          }
        }
      })

      if (shops.length === 0) {
        return [fallbackShopSummary]
      }

      return shops.map((shop) => {
        const mappedShop = mapShop(shop)
        const mappedCategories = shop.categories.map(mapCategory)
        return toShopSummary(mappedShop, mappedCategories)
      })
    } catch {
      return [fallbackShopSummary]
    }
  }

  async getShopMenu(shopId: string): Promise<ShopMenuPayload> {
    try {
      const shop = await this.prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              recipes: {
                orderBy: { createdAt: 'asc' }
              }
            }
          }
        }
      })

      if (!shop) {
        if (shopId === fallbackShop.id) {
          return {
            shop: fallbackShop,
            categories: fallbackCategories
          }
        }

        throw new NotFoundException('店铺不存在。')
      }

      return {
        shop: mapShop(shop),
        categories: shop.categories.map(mapCategory)
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }

      return {
        shop: fallbackShop,
        categories: fallbackCategories
      }
    }
  }

  async getShopCategories(shopId: string): Promise<CategorySummary[]> {
    const menu = await this.getShopMenu(shopId)
    return menu.categories.map(toCategorySummary)
  }

  async getShopProducts(shopId: string, categoryId?: string): Promise<ProductListItem[]> {
    try {
      const where = {
        shopId,
        ...(categoryId ? { categoryId } : {})
      }

      const products = await this.prisma.recipe.findMany({
        where,
        include: {
          category: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      if (products.length === 0) {
        const menu = await this.getShopMenu(shopId)
        const filteredCategories = categoryId
          ? menu.categories.filter((category) => category.id === categoryId)
          : menu.categories

        return toProductList(filteredCategories)
      }

      return products.map((product) => mapPrismaProductListItem(product, product.category.name))
    } catch {
      const menu = await this.getShopMenu(shopId)
      const filteredCategories = categoryId
        ? menu.categories.filter((category) => category.id === categoryId)
        : menu.categories

      return toProductList(filteredCategories)
    }
  }
}
