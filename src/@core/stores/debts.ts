import { Debt } from '@/interface/debt.interface'
import { ApiResponse } from '@/type/api-response.type'
import { defineStore } from 'pinia'

export const useDebtsStore = defineStore('debts', {
  state: () => ({
    debts: [] as Debt[],
    page: 1,
    total: 0,
    limit: 20,
    overdue: [] as Debt[],
  }),

  actions: {
    async fetchDebts(page: number = 1, status?: string, customerId?: number) {
      const query = new URLSearchParams({ page: String(page) })
      if (status) query.append('status', status)
      if (customerId) query.append('customerId', String(customerId))

      const response: ApiResponse<Debt> = await $api(`/debts?${query.toString()}`)
      this.debts = response.data.data
      this.total = response.data.meta.total
      this.limit = response.data.meta.limit
      this.page = page
    },

    async fetchOverdue() {
      const response: { data: Debt[] } = await $api('/debts/overdue')
      this.overdue = response.data
      return this.overdue
    },

    async fetchOne(id: number) {
      const response: { data: Debt } = await $api(`/debts/${id}`)
      return response.data
    },

    async addPayment(id: number, data: { amount: number; paymentType: string; note?: string }) {
      const response: { data: Debt } = await $api(`/debts/${id}/payments`, {
        method: 'post',
        body: data,
      })
      return response.data
    },

    async createManualDebt(data: {
      customerId: number
      amount: number
      note?: string
      dueDate?: string
    }) {
      const response: { data: Debt } = await $api('/debts', {
        method: 'post',
        body: data,
      })
      return response.data
    },
  },
})
