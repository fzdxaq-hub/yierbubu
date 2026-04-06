import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { CartDetail, CartItem, RecipeStatus } from '@haodacai/shared'
import type {
  Cart as PrismaCart,
  CartItem as PrismaCartItem,
  MenuCategory as PrismaMenuCategory,
  Recipe as PrismaRecipe
} from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AddCartItemDto } from './dto/add-cart-item.dto'
import { UpdateCartItemDto } from './dto/update-cart-item.dto'

type PrismaCartWithItems = PrismaCart & { items: PrismaCartItem[] }
type PrismaRecipeWithCategory = PrismaRecipe & { category: PrismaMenuCategory }

const mapCartItem = (item: PrismaCartItem): CartItem => ({
  id: item.id,
  cartId: item.cartId,
  productId: item.productId,
  shopId: item.shopId,
  categoryId: item.categoryId,
  categoryName: item.categoryName,
  name: item.name,
  badge: item.badge ?? undefined,
  price: item.price,
  quantity: item.quantity,
  lineAmount: item.price * item.quantity,
  stock: item.stock,
  status: item.status as RecipeStatus,
  thumbTone: item.thumbTone,
  thumbAccent: item.thumbAccent
})

const mapCartDetail = (cart: PrismaCartWithItems): CartDetail => {
  const items = cart.items.map(mapCartItem)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.lineAmount, 0)

  return {
    id: cart.id,
    userId: cart.userId,
    shopId: cart.shopId ?? undefined,
    items,
    itemCount: items.length,
    totalQuantity,
    totalAmount,
    updatedAt: cart.updatedAt.toISOString()
  }
}

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCart(userId: string) {
    return this.prisma.cart.upsert({
      where: {
        userId
      },
      update: {},
      create: {
        userId
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
  }

  private validateQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('数量非法。')
    }
  }

  private ensureStock(product: PrismaRecipe, quantity: number) {
    if (product.stock < quantity) {
      throw new BadRequestException('库存不足。')
    }
  }

  private async getValidProduct(productId: string): Promise<PrismaRecipeWithCategory> {
    const product = await this.prisma.recipe.findUnique({
      where: {
        id: productId
      },
      include: {
        category: true
      }
    })

    if (!product) {
      throw new NotFoundException('商品不存在。')
    }

    if (!product.isOnline) {
      throw new BadRequestException('商品已下架。')
    }

    return product
  }

  private buildSnapshot(product: PrismaRecipeWithCategory, quantity: number) {
    return {
      productId: product.id,
      shopId: product.shopId,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      name: product.name,
      badge: product.badge ?? null,
      price: product.price,
      quantity,
      stock: product.stock,
      status: product.isOnline ? 'onShelf' : 'offShelf',
      thumbTone: product.thumbTone,
      thumbAccent: product.thumbAccent
    }
  }

  async getCart(userId: string): Promise<CartDetail> {
    return mapCartDetail(await this.ensureCart(userId))
  }

  async addCartItem(userId: string, payload: AddCartItemDto): Promise<CartDetail> {
    this.validateQuantity(payload.quantity)

    const [cart, product] = await Promise.all([this.ensureCart(userId), this.getValidProduct(payload.productId)])

    if (cart.shopId && cart.shopId !== product.shopId && cart.items.length > 0) {
      throw new BadRequestException('当前购物车仅支持单店结算，请先清空后再添加其他店铺商品。')
    }

    const existingItem = cart.items.find((item) => item.productId === product.id)
    const nextQuantity = (existingItem?.quantity ?? 0) + payload.quantity
    this.ensureStock(product, nextQuantity)

    await this.prisma.$transaction(async (tx) => {
      if (existingItem) {
        await tx.cartItem.update({
          where: {
            id: existingItem.id
          },
          data: this.buildSnapshot(product, nextQuantity)
        })
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            ...this.buildSnapshot(product, payload.quantity)
          }
        })
      }

      await tx.cart.update({
        where: {
          id: cart.id
        },
        data: {
          shopId: product.shopId,
          lastOrderId: null,
          lastSubmittedAt: null
        }
      })
    })

    return this.getCart(userId)
  }

  async updateCartItem(userId: string, id: string, payload: UpdateCartItemDto): Promise<CartDetail> {
    this.validateQuantity(payload.quantity)

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        id,
        cart: {
          userId
        }
      },
      include: {
        cart: true
      }
    })

    if (!existingItem) {
      throw new NotFoundException('购物车项不存在。')
    }

    const product = await this.getValidProduct(existingItem.productId)
    this.ensureStock(product, payload.quantity)

    await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.update({
        where: {
          id: existingItem.id
        },
        data: this.buildSnapshot(product, payload.quantity)
      })

      await tx.cart.update({
        where: {
          id: existingItem.cartId
        },
        data: {
          lastOrderId: null,
          lastSubmittedAt: null
        }
      })
    })

    return this.getCart(userId)
  }

  async deleteCartItem(userId: string, id: string): Promise<CartDetail> {
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        id,
        cart: {
          userId
        }
      }
    })

    if (!existingItem) {
      throw new NotFoundException('购物车项不存在。')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.delete({
        where: {
          id: existingItem.id
        }
      })

      const remainingCount = await tx.cartItem.count({
        where: {
          cartId: existingItem.cartId
        }
      })

      await tx.cart.update({
        where: {
          id: existingItem.cartId
        },
        data: {
          shopId: remainingCount === 0 ? null : existingItem.shopId,
          lastOrderId: null,
          lastSubmittedAt: null
        }
      })
    })

    return this.getCart(userId)
  }
}
