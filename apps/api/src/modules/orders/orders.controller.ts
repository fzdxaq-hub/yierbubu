import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import type { AuthUser } from '@haodacai/shared'
import { AuthGuard } from '../../common/auth/auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import { RequireRoles } from '../../common/auth/roles.decorator'
import { RolesGuard } from '../../common/auth/roles.guard'
import { successResponse } from '../../common/http/api-response'
import { ListOrdersQueryDto } from './dto/list-orders.query.dto'
import { OrderIdParamDto } from './dto/order-id-param.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { OrdersService } from './orders.service'

@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequireRoles('end_user')
  async createOrder(@CurrentUser() user: AuthUser) {
    return successResponse(await this.ordersService.createOrder(user), '创建订单成功。')
  }

  @Get()
  async getOrders(@CurrentUser() user: AuthUser, @Query() query: ListOrdersQueryDto) {
    return successResponse(await this.ordersService.getOrders(user, query), '获取订单列表成功。')
  }

  @Get(':id')
  async getOrderById(@CurrentUser() user: AuthUser, @Param() params: OrderIdParamDto) {
    return successResponse(await this.ordersService.getOrderById(user, params.id), '获取订单详情成功。')
  }

  @Post(':id/pay')
  @RequireRoles('end_user')
  async payOrder(@CurrentUser() user: AuthUser, @Param() params: OrderIdParamDto) {
    return successResponse(await this.ordersService.payOrder(user, params.id), '模拟支付成功。')
  }

  @Patch(':id/status')
  @RequireRoles('merchant_admin', 'super_admin')
  async updateOrderStatus(@Param() params: OrderIdParamDto, @Body() payload: UpdateOrderStatusDto) {
    return successResponse(await this.ordersService.updateOrderStatus(params.id, payload), '订单状态更新成功。')
  }
}
