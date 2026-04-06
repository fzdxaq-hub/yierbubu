import { Module } from '@nestjs/common'
import { ShopsModule } from '../shops/shops.module'
import { CategoriesController } from './categories.controller'
import { CategoriesService } from './categories.service'

@Module({
  imports: [ShopsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService]
})
export class CategoriesModule {}
