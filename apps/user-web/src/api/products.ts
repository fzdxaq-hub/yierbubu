import { request } from '@/lib/request'
import type { ProductListItem } from '@haodacai/shared'

export interface GetShopProductsParams {
  categoryId?: string
}

export const getShopProducts = (shopId: string, params: GetShopProductsParams = {}) =>
  request<ProductListItem[]>('/products', {
    query: {
      shopId,
      categoryId: params.categoryId
    }
  })

export const getProductById = (productId: string) => request<ProductListItem>(`/products/${productId}`)
