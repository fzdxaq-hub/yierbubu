import { randomUUID } from 'node:crypto'
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { orderStatusValues } from '@haodacai/shared'
import type { AuthUser, OrderDetail, OrderItem, OrderStatus, OrderSummary } from '@haodacai/shared'
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  OrderStatus as PrismaOrderStatus,
  Prisma,
  Recipe as PrismaRecipe
} from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service'
import { ListOrdersQueryDto } from './dto/list-orders.query.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'

type PrismaOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] }

const toOrderStatus = (status: PrismaOrderStatus): OrderStatus => {
  switch (status) {
    case 'PAID':
      return orderStatusValues.paid
    case 'CANCELLED':
      return orderStatusValues.cancelled
    case 'COMPLETED':
      return orderStatusValues.completed
    default:
      return orderStatusValues.pendingPayment
  }
}

const toPrismaOrderStatus = (status: OrderStatus): PrismaOrderStatus => {
  switch (status) {
    case 'paid':
      return 'PAID'
    case 'cancelled':
      return 'CANCELLED'
    case 'completed':
      return 'COMPLETED'
    default:
      return 'PENDING_PAYMENT'
  }
}

const toTimestamp = (value?: Date | null) => (value ? value.toISOString() : undefined)

const mapOrderItem = (item: PrismaOrderItem): OrderItem => ({
  id: item.id,
  orderId: item.orderId,
  productId: item.productId,
  categoryId: item.categoryId,
  categoryName: item.categoryName,
  name: item.name,
  badge: item.badge ?? undefined,
  price: item.price,
  quantity: item.quantity,
  lineAmount: item.lineAmount,
  thumbTone: item.thumbTone,
  thumbAccent: item.thumbAccent
})

const mapOrderSummary = (order: PrismaOrder): OrderSummary => ({
  id: order.id,
  orderNo: order.orderNo,
  userId: order.userId,
  shopId: order.shopId,
  shopName: order.shopName,
  status: toOrderStatus(order.status),
  itemCount: order.itemCount,
  totalQuantity: order.totalQuantity,
  totalAmount: order.totalAmount,
  createdAt: order.createdAt.toISOString(),
  updatedAt: order.updatedAt.toISOString(),
  paidAt: toTimestamp(order.paidAt),
  cancelledAt: toTimestamp(order.cancelledAt),
  completedAt: toTimestamp(order.completedAt)
})

const mapOrderDetail = (order: PrismaOrderWithItems): OrderDetail => ({
  ...mapOrderSummary(order),
  items: order.items.map(mapOrderItem)
})

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private buildOrderNo() {
    const base = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
    const suffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
    return `OD${base}${suffix}`
  }

  private ensureStock(product: PrismaRecipe, quantity: number) {
    if (product.stock < quantity) {
      throw new BadRequestException('库存不足。')
    }
  }

  private async restoreStock(tx: Prisma.TransactionClient, items: PrismaOrderItem[]) {
    for (const item of items) {
      const recipe = await tx.recipe.findUnique({
        where: {
          id: item.productId
        }
      })

      if (!recipe) {
        continue
      }

      await tx.recipe.update({
        where: {
          id: item.productId
        },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      })
    }
  }

  private assertStatusTransition(order: PrismaOrderWithItems, nextStatus: OrderStatus) {
    const currentStatus = toOrderStatus(order.status)

    if (currentStatus === nextStatus) {
      return
    }

    if (nextStatus === orderStatusValues.pendingPayment) {
      throw new BadRequestException('订单状态不可回退到待支付。')
    }

    if (currentStatus === orderStatusValues.pendingPayment) {
      if (nextStatus === orderStatusValues.paid || nextStatus === orderStatusValues.cancelled) {
        return
      }
    }

    if (currentStatus === orderStatusValues.paid) {
      if (nextStatus === orderStatusValues.completed || nextStatus === orderStatusValues.cancelled) {
        return
      }
    }

    throw new BadRequestException('订单状态流转不合法。')
  }

  private assertOrderAccess(order: PrismaOrder, currentUser: AuthUser) {
    if (currentUser.role === 'end_user' && order.userId !== currentUser.id) {
      throw new ForbiddenException('无权访问他人的订单。')
    }
  }

  async createOrder(currentUser: AuthUser): Promise<OrderDetail> {
    const cart = await this.prisma.cart.findUnique({
      where: {
        userId: currentUser.id
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!cart || cart.items.length === 0) {
      if (cart?.lastOrderId) {
        throw new BadRequestException('订单已提交，请勿重复提交。')
      }

      throw new BadRequestException('购物车为空。')
    }

    const productIds = cart.items.map((item) => item.productId)
    const products = await this.prisma.recipe.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
        category: true,
        shop: true
      }
    })

    if (products.length !== productIds.length) {
      throw new NotFoundException('商品不存在。')
    }

    const productMap = new Map(products.map((product) => [product.id, product]))
    let totalQuantity = 0
    let totalAmount = 0

    const orderItems = cart.items.map((item) => {
      const product = productMap.get(item.productId)

      if (!product) {
        throw new NotFoundException('商品不存在。')
      }

      if (!product.isOnline) {
        throw new BadRequestException(`商品“${product.name}”已下架。`)
      }

      this.ensureStock(product, item.quantity)

      const lineAmount = product.price * item.quantity
      totalQuantity += item.quantity
      totalAmount += lineAmount

      return {
        productId: product.id,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        name: product.name,
        badge: product.badge ?? null,
        price: product.price,
        quantity: item.quantity,
        lineAmount,
        thumbTone: product.thumbTone,
        thumbAccent: product.thumbAccent
      }
    })

    const firstCartProduct = productMap.get(cart.items[0].productId)

    if (!firstCartProduct) {
      throw new BadRequestException('购物车为空。')
    }

    const orderId = randomUUID()
    const submittedAt = new Date()
    const transactionOps: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.order.create({
        data: {
          id: orderId,
          orderNo: this.buildOrderNo(),
          userId: currentUser.id,
          shopId: firstCartProduct.shopId,
          shopName: firstCartProduct.shop.name,
          status: 'PENDING_PAYMENT',
          itemCount: orderItems.length,
          totalQuantity,
          totalAmount
        }
      })
    ]

    for (const item of orderItems) {
      transactionOps.push(
        this.prisma.orderItem.create({
          data: {
            orderId,
            ...item
          }
        })
      )
    }

    for (const item of orderItems) {
      transactionOps.push(
        this.prisma.recipe.update({
          where: {
            id: item.productId
          },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      )
    }

    for (const item of cart.items) {
      transactionOps.push(
        this.prisma.cartItem.delete({
          where: {
            id: item.id
          }
        })
      )
    }

    transactionOps.push(
      this.prisma.cart.update({
        where: {
          id: cart.id
        },
        data: {
          shopId: null,
          lastOrderId: orderId,
          lastSubmittedAt: submittedAt
        }
      })
    )

    await this.prisma.$transaction(transactionOps)

    const created = await this.prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!created) {
      throw new NotFoundException('订单不存在。')
    }

    return mapOrderDetail(created)
  }

  async getOrders(currentUser: AuthUser, query: ListOrdersQueryDto): Promise<OrderSummary[]> {
    const where: Prisma.OrderWhereInput = {}

    if (currentUser.role === 'end_user') {
      where.userId = currentUser.id
    }

    if (currentUser.role === 'merchant_admin') {
      if (!currentUser.shopId) {
        return []
      }

      where.shopId = currentUser.shopId
    }

    if (query.status) {
      where.status = toPrismaOrderStatus(query.status)
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return orders.map(mapOrderSummary)
  }

  async getOrderById(currentUser: AuthUser, id: string): Promise<OrderDetail> {
    const order = await this.prisma.order.findUnique({
      where: {
        id
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!order) {
      throw new NotFoundException('订单不存在。')
    }

    this.assertOrderAccess(order, currentUser)

    return mapOrderDetail(order)
  }

  async payOrder(currentUser: AuthUser, id: string): Promise<OrderDetail> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id
        },
        include: {
          items: true
        }
      })

      if (!order) {
        throw new NotFoundException('订单不存在。')
      }

      this.assertOrderAccess(order, currentUser)

      if (order.status !== 'PENDING_PAYMENT') {
        throw new BadRequestException('订单当前状态不可支付。')
      }

      return tx.order.update({
        where: {
          id
        },
        data: {
          status: 'PAID',
          paidAt: new Date()
        },
        include: {
          items: true
        }
      })
    })

    return mapOrderDetail(updated)
  }

  async updateOrderStatus(id: string, payload: UpdateOrderStatusDto): Promise<OrderDetail> {
    const nextStatus = payload.status

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id
        },
        include: {
          items: true
        }
      })

      if (!order) {
        throw new NotFoundException('订单不存在。')
      }

      this.assertStatusTransition(order, nextStatus)

      if (toOrderStatus(order.status) === nextStatus) {
        return order
      }

      if (nextStatus === orderStatusValues.cancelled) {
        await this.restoreStock(tx, order.items)
      }

      const data: Prisma.OrderUpdateInput = {
        status: toPrismaOrderStatus(nextStatus)
      }

      if (nextStatus === orderStatusValues.paid && !order.paidAt) {
        data.paidAt = new Date()
      }

      if (nextStatus === orderStatusValues.cancelled && !order.cancelledAt) {
        data.cancelledAt = new Date()
      }

      if (nextStatus === orderStatusValues.completed && !order.completedAt) {
        data.completedAt = new Date()
      }

      return tx.order.update({
        where: {
          id
        },
        data,
        include: {
          items: true
        }
      })
    })

    return mapOrderDetail(updated)
  }
}
