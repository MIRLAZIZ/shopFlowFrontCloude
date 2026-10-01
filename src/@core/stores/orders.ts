import { Order } from '@/interface/order.interface'
import { ApiResponse } from '@/type/api-response.type'
import { defineStore } from 'pinia'

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [] as Order[],
    page: 1,
    total: 0,
    limit: 12,
  }),

  actions: {
    async createOrder(payload: {
      items: { product_id: number; quantity: number; discount?: number }[]
      paymentType: string
      payments?: { type: string; amount: number }[]
      paidAmount?: number
      customerId?: number
    }) {
      const response: { data: Order } = await $api('/orders', {
        method: 'post',
        body: payload,
      })
      return response.data
    },

    async fetchOrders(page: number = 1) {
      const response: ApiResponse<Order> = await $api(`/orders?page=${page}`)
      this.orders = response.data.data
      this.total = response.data.meta.total
      this.limit = response.data.meta.limit
      this.page = page
    },

    async searchOrders(params: Record<string, any>) {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value))
        }
      })
      const response: ApiResponse<Order> = await $api(`/orders/search?${query.toString()}`)
      this.orders = response.data.data
      this.total = response.data.meta.total
      this.limit = response.data.meta.limit
    },

    async fetchOrder(id: number) {
      const response: { data: Order } = await $api(`/orders/${id}`)
      return response.data
    },

    async cancelOrder(id: number, reason?: string) {
      return await $api(`/orders/cancel/${id}`, {
        method: 'post',
        body: { reason },
      })
    },

    // Qisman qaytarish: bitta chekdagi ayrim mahsulotlarni, kerakli
    // miqdorda qaytarish (butun chekni bekor qilmasdan)
    async createReturn(orderId: number, payload: { items: { orderItemId: number; quantity: number }[]; reason?: string }) {
      const response: { data: any } = await $api(`/orders/${orderId}/returns`, {
        method: 'post',
        body: payload,
      })
      return response.data
    },

    async fetchOrderReturns(orderId: number) {
      const response: { data: any[] } = await $api(`/orders/${orderId}/returns`)
      return response.data
    },
  },
})
