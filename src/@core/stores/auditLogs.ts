import { AuditLog } from '@/interface/audit-log.interface'
import { ApiResponse } from '@/type/api-response.type'
import { defineStore } from 'pinia'

export const useAuditLogsStore = defineStore('auditLogs', {
  state: () => ({
    logs: [] as AuditLog[],
    page: 1,
    total: 0,
    limit: 30,
  }),

  actions: {
    async fetchLogs(
      page: number = 1,
      filters?: { entityType?: string; action?: string; userId?: number; dateFrom?: string; dateTo?: string },
    ) {
      const query = new URLSearchParams({ page: String(page) })
      if (filters?.entityType) query.append('entityType', filters.entityType)
      if (filters?.action) query.append('action', filters.action)
      if (filters?.userId) query.append('userId', String(filters.userId))
      if (filters?.dateFrom) query.append('dateFrom', filters.dateFrom)
      if (filters?.dateTo) query.append('dateTo', filters.dateTo)

      const response: ApiResponse<AuditLog> = await $api(`/audit-logs?${query.toString()}`)
      this.logs = response.data.data
      this.total = response.data.meta.total
      this.limit = response.data.meta.limit
      this.page = page
    },
  },
})
