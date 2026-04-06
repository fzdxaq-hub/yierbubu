import { request } from '@/lib/request'
import type { ShopMenuPayload, ShopSummary } from '@haodacai/shared'

export const getActiveShop = () => request<ShopSummary>('/shops/active')

export const getShopSummaries = () => request<ShopSummary[]>('/shops')

export const getShopMenu = (shopId: string) => request<ShopMenuPayload>(`/shops/${shopId}/menu`)
