import { Customer } from '@/interface/customer.interface'
import { ApiResponse } from '@/type/api-response.type'
import { defineStore } from 'pinia'

export const useCustomersStore = defineStore('customers', {
  state: () => ({
    customers: [] as Customer[],
    page: 1,
    total: 0,
    limit: 20,
  }),

  actions: {
    async fetchCustomers(page: number = 1, search?: string) {
      const query = new URLSearchParams({ page: String(page) })
      if (search) query.append('search', search)

      const response: ApiResponse<Customer> = await $api(`/customers?${query.toString()}`)
      this.customers = response.data.data
      this.total = response.data.meta.total
      this.limit = response.data.meta.limit
      this.page = page
      return this.customers
    },

    async createCustomer(data: { fullName: string; phone?: string; note?: string }) {
      const response: { data: Customer } = await $api('/customers', {
        method: 'post',
        body: data,
      })
      return response.data
    },

    async updateCustomer(id: number, data: { fullName?: string; phone?: string; note?: string }) {
      return await $api(`/customers/${id}`, {
        method: 'put',
        body: data,
      })
    },

    async deleteCustomer(id: number) {
      return await $api(`/customers/${id}`, {
        method: 'delete',
      })
    },

    async fetchOne(id: number) {
      const response: { data: Customer } = await $api(`/customers/${id}`)
      return response.data
    },
  },
})
