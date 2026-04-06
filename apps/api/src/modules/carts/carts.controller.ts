import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import type { AuthUser } from '@haodacai/shared'
import { successResponse } from '../../common/http/api-response'
import { AuthGuard } from '../../common/auth/auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import { RequireRoles } from '../../common/auth/roles.decorator'
import { RolesGuard } from '../../common/auth/roles.guard'
import { CartsService } from './carts.service'
import { AddCartItemDto } from './dto/add-cart-item.dto'
import { CartItemIdParamDto } from './dto/cart-item-id-param.dto'
import { UpdateCartItemDto } from './dto/update-cart-item.dto'

@Controller('cart')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('end_user')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  async getCart(@CurrentUser() user: AuthUser) {
    return successResponse(await this.cartsService.getCart(user.id), '获取购物车成功。')
  }

  @Post('items')
  async addCartItem(@CurrentUser() user: AuthUser, @Body() payload: AddCartItemDto) {
    return successResponse(await this.cartsService.addCartItem(user.id, payload), '加入购物车成功。')
  }

  @Patch('items/:id')
  async updateCartItem(
    @CurrentUser() user: AuthUser,
    @Param() params: CartItemIdParamDto,
    @Body() payload: UpdateCartItemDto
  ) {
    return successResponse(await this.cartsService.updateCartItem(user.id, params.id, payload), '更新购物车成功。')
  }

  @Delete('items/:id')
  async deleteCartItem(@CurrentUser() user: AuthUser, @Param() params: CartItemIdParamDto) {
    return successResponse(await this.cartsService.deleteCartItem(user.id, params.id), '删除购物车项成功。')
  }
}
