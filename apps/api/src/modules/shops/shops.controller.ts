import { Controller, Get, Param } from '@nestjs/common'
import { successResponse } from '../../common/http/api-response'
import { ShopsService } from './shops.service'

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('active')
  async getActiveShop() {
    return successResponse(await this.shopsService.getActiveShop(), '获取当前店铺成功。')
  }

  @Get()
  async getShopSummaries() {
    return successResponse(await this.shopsService.getShopSummaries(), '获取店铺列表成功。')
  }

  @Get(':shopId/menu')
  async getShopMenu(@Param('shopId') shopId: string) {
    return successResponse(await this.shopsService.getShopMenu(shopId), '获取菜谱菜单成功。')
  }
}
