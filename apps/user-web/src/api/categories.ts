import { request } from '@/lib/request'
import type { CategorySummary } from '@haodacai/shared'

export const getShopCategories = (shopId: string) =>
  request<CategorySummary[]>('/categories', {
    query: {
      shopId
    }
  })
