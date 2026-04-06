import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../../common/auth/auth.guard'
import { RequireRoles } from '../../common/auth/roles.decorator'
import { RolesGuard } from '../../common/auth/roles.guard'
import { successResponse } from '../../common/http/api-response'
import { fallbackShop } from '../shops/shops.fallback'
import { ProductsService } from './products.service'
import { BatchUpdateProductStatusDto } from './dto/batch-update-product-status.dto'
import { CreateProductDto } from './dto/create-product.dto'
import { ListProductsQueryDto } from './dto/list-products.query.dto'
import { ProductIdParamDto } from './dto/product-id-param.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getShopProducts(@Query() query: ListProductsQueryDto) {
    const shopId = query.shopId ?? fallbackShop.id
    return successResponse(
      await this.productsService.getShopProducts(shopId, query.categoryId),
      '获取商品列表成功。'
    )
  }

  @Get(':id')
  async getProductById(@Param() params: ProductIdParamDto) {
    return successResponse(await this.productsService.getProductById(params.id), '获取商品详情成功。')
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('merchant_admin', 'super_admin')
  async createProduct(@Body() payload: CreateProductDto) {
    return successResponse(await this.productsService.createProduct(payload), '商品创建成功。')
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('merchant_admin', 'super_admin')
  async updateProduct(@Param() params: ProductIdParamDto, @Body() payload: UpdateProductDto) {
    return successResponse(await this.productsService.updateProduct(params.id, payload), '商品更新成功。')
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('merchant_admin', 'super_admin')
  async deleteProduct(@Param() params: ProductIdParamDto) {
    return successResponse(await this.productsService.deleteProduct(params.id), '商品删除成功。')
  }

  @Post('batch-status')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('merchant_admin', 'super_admin')
  async batchUpdateProductStatus(@Body() payload: BatchUpdateProductStatusDto) {
    return successResponse(
      await this.productsService.batchUpdateProductStatus(payload),
      '批量上下架成功。'
    )
  }
}
