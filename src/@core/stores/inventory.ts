import { InventorySession, InventorySessionListItem } from '@/interface/inventory.interface'
import { ApiResponse } from '@/type/api-response.type'
import { defineStore } from 'pinia'

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    sessions: [] as InventorySessionListItem[],
    page: 1,
    total: 0,
    limit: 20,
  }),

  actions: {
    async startSession(note?: string) {
      const response: { data: InventorySession } = await $api('/inventory/sessions', {
        method: 'post',
        body: { note },
      })
      return response.data
    },

    async fetchSessions(page: number = 1) {
      const response: ApiResponse<InventorySessionListItem> = await $api(`/inventory/sessions?page=${page}`)
      this.sessions = response.data.data
      this.total = response.data.meta.total
      this.limit = response.data.meta.limit
      this.page = page
    },

    async fetchSession(id: number) {
      const response: { data: InventorySession } = await $api(`/inventory/sessions/${id}`)
      return response.data
    },

    async recordCount(sessionId: number, batchId: number, countedQuantity: number) {
      return await $api(`/inventory/sessions/${sessionId}/count`, {
        method: 'post',
        body: { batchId, countedQuantity },
      })
    },

    async completeSession(sessionId: number, note?: string) {
      const response: { data: any } = await $api(`/inventory/sessions/${sessionId}/complete`, {
        method: 'post',
        body: { note },
      })
      return response.data
    },

    async cancelSession(sessionId: number) {
      return await $api(`/inventory/sessions/${sessionId}/cancel`, { method: 'post' })
    },
  },
})
