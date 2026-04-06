import { Module } from '@nestjs/common'
import { HealthController } from './modules/health/health.controller'
import { PrismaModule } from './common/prisma/prisma.module'
import { ShopsModule } from './modules/shops/shops.module'
import { CategoriesModule } from './modules/categories/categories.module'
import { ProductsModule } from './modules/products/products.module'
import { CartsModule } from './modules/carts/carts.module'
import { OrdersModule } from './modules/orders/orders.module'
import { AuthModule } from './modules/auth/auth.module'

@Module({
  imports: [PrismaModule, AuthModule, ShopsModule, CategoriesModule, ProductsModule, CartsModule, OrdersModule],
  controllers: [HealthController]
})
export class AppModule {}
