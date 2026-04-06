import { apiRequest } from '@/lib/api-request'
import type { ShopMenuPayload, ShopSummary } from '@/types/menu'

export const getActiveShop = () => apiRequest<ShopSummary>('/shops/active')

export const getShopSummaries = () => apiRequest<ShopSummary[]>('/shops')

export const getShopMenu = (shopId: string) => apiRequest<ShopMenuPayload>(`/shops/${shopId}/menu`)
