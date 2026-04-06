import type { OrderDetail, OrderStatus, OrderSummary } from '@haodacai/shared'
import { apiRequest } from '@/lib/api-request'

export interface GetOrdersParams {
  status?: OrderStatus
  scope?: 'admin' | 'user'
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
}

export const getOrders = (params: GetOrdersParams = {}) =>
  apiRequest<OrderSummary[]>('/orders', {
    query: {
      status: params.status,
      scope: params.scope ?? 'admin'
    }
  })

export const getOrderById = (orderId: string) => apiRequest<OrderDetail>(`/orders/${orderId}`)

export const updateOrderStatus = (orderId: string, payload: UpdateOrderStatusPayload) =>
  apiRequest<OrderDetail>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: payload as unknown as Record<string, unknown>
  })
