import type { OrderDetail, OrderStatus, OrderSummary } from '@haodacai/shared'
import { request } from '@/lib/request'

export interface GetOrdersParams {
  status?: OrderStatus
}

export const createOrder = () =>
  request<OrderDetail>('/orders', {
    method: 'POST'
  })

export const getOrders = (params: GetOrdersParams = {}) =>
  request<OrderSummary[]>('/orders', {
    query: {
      status: params.status
    }
  })

export const getOrderById = (orderId: string) => request<OrderDetail>(`/orders/${orderId}`)

export const payOrder = (orderId: string) =>
  request<OrderDetail>(`/orders/${orderId}/pay`, {
    method: 'POST'
  })
