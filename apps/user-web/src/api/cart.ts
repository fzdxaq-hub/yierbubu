import type { CartDetail } from '@haodacai/shared'
import { request } from '@/lib/request'

export interface AddCartItemPayload {
  productId: string
  quantity: number
}

export interface UpdateCartItemPayload {
  quantity: number
}

export const getCart = () => request<CartDetail>('/cart')

export const addCartItem = (payload: AddCartItemPayload) =>
  request<CartDetail>('/cart/items', {
    method: 'POST',
    body: payload as unknown as Record<string, unknown>
  })

export const updateCartItem = (id: string, payload: UpdateCartItemPayload) =>
  request<CartDetail>(`/cart/items/${id}`, {
    method: 'PATCH',
    body: payload as unknown as Record<string, unknown>
  })

export const deleteCartItem = (id: string) =>
  request<CartDetail>(`/cart/items/${id}`, {
    method: 'DELETE'
  })
