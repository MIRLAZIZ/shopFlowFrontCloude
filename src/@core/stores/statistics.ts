import { StatisticsDashboard } from '@/interface/statistics.interface'
import { defineStore } from 'pinia'

export const useStatisticsStore = defineStore('statistics', {
  state: () => ({
    dashboard: null as StatisticsDashboard | null,
    loading: false,
  }),

  actions: {
    async fetchDashboard(period: 'today' | 'week' | 'month' | 'year' = 'week') {
      this.loading = true
      try {
        const response: { data: StatisticsDashboard } = await $api(`/statistics/dashboard?period=${period}`)
        this.dashboard = response.data
        return this.dashboard
      } finally {
        this.loading = false
      }
    },
  },
})
