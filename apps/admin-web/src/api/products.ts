import { apiRequest } from '@/lib/api-request'
import type { ProductListItem } from '@/types/menu'

export interface GetShopProductsParams {
  categoryId?: string
}

export interface ProductWritePayload {
  shopId: string
  categoryId: string
  name: string
  badge?: string
  cover?: string
  rating: number
  price: number
  sales: number
  stock: number
  isOnline: boolean
  tags: string[]
  thumbTone?: string
  thumbAccent?: string
}

export interface BatchUpdateProductStatusPayload {
  ids: string[]
  isOnline: boolean
}

export const getShopProducts = (shopId: string, params: GetShopProductsParams = {}) =>
  apiRequest<ProductListItem[]>('/products', {
    query: {
      shopId,
      categoryId: params.categoryId
    }
  })

export const createProduct = (payload: ProductWritePayload) =>
  apiRequest<ProductListItem>('/products', {
    method: 'POST',
    body: payload as unknown as Record<string, unknown>
  })

export const updateProduct = (id: string, payload: ProductWritePayload) =>
  apiRequest<ProductListItem>(`/products/${id}`, {
    method: 'PATCH',
    body: payload as unknown as Record<string, unknown>
  })

export const deleteProduct = (id: string) =>
  apiRequest<{ id: string }>(`/products/${id}`, {
    method: 'DELETE'
  })

export const batchUpdateProductStatus = (payload: BatchUpdateProductStatusPayload) =>
  apiRequest<{ updatedCount: number }>('/products/batch-status', {
    method: 'POST',
    body: payload as unknown as Record<string, unknown>
  })
