import { apiRequest } from '@/lib/api-request'
import type { CategorySummary } from '@/types/menu'

export const getShopCategories = (shopId: string) =>
  apiRequest<CategorySummary[]>('/categories', {
    query: { shopId }
  })
