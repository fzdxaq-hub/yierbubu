import { Injectable } from '@nestjs/common'
import { ShopsService } from '../shops/shops.service'

@Injectable()
export class CategoriesService {
  constructor(private readonly shopsService: ShopsService) {}

  getShopCategories(shopId: string) {
    return this.shopsService.getShopCategories(shopId)
  }
}
