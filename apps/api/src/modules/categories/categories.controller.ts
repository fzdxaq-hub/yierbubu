import { Controller, Get, Query } from '@nestjs/common'
import { successResponse } from '../../common/http/api-response'
import { CategoriesService } from './categories.service'
import { fallbackShop } from '../shops/shops.fallback'

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getShopCategories(@Query('shopId') shopId = fallbackShop.id) {
    return successResponse(await this.categoriesService.getShopCategories(shopId), '获取分类列表成功。')
  }
}
