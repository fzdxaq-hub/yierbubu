import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { ProductListItem } from '@haodacai/shared'
import { PrismaService } from '../../common/prisma/prisma.service'
import { ShopsService } from '../shops/shops.service'
import { fallbackShop } from '../shops/shops.fallback'
import { mapPrismaProductListItem } from './products.mapper'
import { BatchUpdateProductStatusDto } from './dto/batch-update-product-status.dto'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService
  ) {}

  getShopProducts(shopId: string, categoryId?: string) {
    return this.shopsService.getShopProducts(shopId, categoryId)
  }

  async getProductById(id: string): Promise<ProductListItem> {
    const product = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        category: true
      }
    })

    if (product) {
      return mapPrismaProductListItem(product, product.category.name)
    }

    const fallbackMenu = await this.shopsService.getShopMenu(fallbackShop.id)

    for (const category of fallbackMenu.categories) {
      const fallbackProduct = category.recipes.find((recipe) => recipe.id === id)

      if (fallbackProduct) {
        return {
          ...fallbackProduct,
          categoryName: category.name
        }
      }
    }

    throw new NotFoundException('商品不存在。')
  }

  async createProduct(payload: CreateProductDto): Promise<ProductListItem> {
    const category = await this.prisma.menuCategory.findFirst({
      where: {
        id: payload.categoryId,
        shopId: payload.shopId
      }
    })

    if (!category) {
      throw new NotFoundException('目标分类不存在，或不属于当前店铺。')
    }

    const created = await this.prisma.recipe.create({
      data: {
        shopId: payload.shopId,
        categoryId: payload.categoryId,
        name: payload.name.trim(),
        badge: payload.badge?.trim() || null,
        cover: payload.cover?.trim() || null,
        rating: payload.rating,
        price: payload.price,
        sales: payload.sales,
        stock: payload.stock,
        isOnline: payload.isOnline,
        tags: payload.tags,
        thumbTone: payload.thumbTone ?? '#f8d59c',
        thumbAccent: payload.thumbAccent ?? '#d38852'
      }
    })

    return mapPrismaProductListItem(created, category.name)
  }

  async updateProduct(id: string, payload: UpdateProductDto): Promise<ProductListItem> {
    const existing = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        category: true
      }
    })

    if (!existing) {
      throw new NotFoundException('商品不存在。')
    }

    const nextShopId = payload.shopId ?? existing.shopId
    const nextCategoryId = payload.categoryId ?? existing.categoryId

    const category = await this.prisma.menuCategory.findFirst({
      where: {
        id: nextCategoryId,
        shopId: nextShopId
      }
    })

    if (!category) {
      throw new NotFoundException('目标分类不存在，或不属于当前店铺。')
    }

    const updated = await this.prisma.recipe.update({
      where: { id },
      data: {
        shopId: nextShopId,
        categoryId: nextCategoryId,
        name: payload.name?.trim() ?? existing.name,
        badge: payload.badge === undefined ? existing.badge : payload.badge.trim() || null,
        cover: payload.cover === undefined ? existing.cover : payload.cover.trim() || null,
        rating: payload.rating ?? existing.rating,
        price: payload.price ?? existing.price,
        sales: payload.sales ?? existing.sales,
        stock: payload.stock ?? existing.stock,
        isOnline: payload.isOnline ?? existing.isOnline,
        tags: payload.tags === undefined ? (existing.tags ?? undefined) : payload.tags,
        thumbTone: payload.thumbTone ?? existing.thumbTone,
        thumbAccent: payload.thumbAccent ?? existing.thumbAccent
      }
    })

    return mapPrismaProductListItem(updated, category.name)
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.recipe.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new NotFoundException('商品不存在。')
    }

    await this.prisma.recipe.delete({
      where: { id }
    })

    return {
      id
    }
  }

  async batchUpdateProductStatus(payload: BatchUpdateProductStatusDto) {
    if (payload.ids.length === 0) {
      throw new BadRequestException('批量更新请求不能为空。')
    }

    const existingProducts = await this.prisma.recipe.findMany({
      where: {
        id: {
          in: payload.ids
        }
      },
      select: {
        id: true
      }
    })

    if (existingProducts.length !== payload.ids.length) {
      throw new NotFoundException('部分商品不存在，已中止批量上下架。')
    }

    const result = await this.prisma.recipe.updateMany({
      where: {
        id: {
          in: payload.ids
        }
      },
      data: {
        isOnline: payload.isOnline
      }
    })

    return {
      updatedCount: result.count
    }
  }
}
