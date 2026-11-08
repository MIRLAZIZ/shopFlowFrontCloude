import { AssetsReport, CashAdjustment, Supplier, SupplierDebt } from '@/interface/finance.interface'
import { defineStore } from 'pinia'

function toQuery(params: Record<string, any>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
  })
  return q.toString()
}

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    assets: null as AssetsReport | null,
    suppliers: [] as Supplier[],
    debts: [] as SupplierDebt[],
    debtsPage: 1,
    debtsTotal: 0,
    debtsLimit: 20,
    adjustments: [] as CashAdjustment[],
  }),

  actions: {
    // ── Aylanma aktivlar ──
    async fetchAssets() {
      const response: { data: AssetsReport } = await $api('/finance/assets')
      this.assets = response.data
      return this.assets
    },

    async setOpening(data: { openingCash: number; openingBank: number; startDate: string }) {
      return await $api('/finance/opening', { method: 'put', body: data })
    },

    // ── Qo'lda pul harakati ──
    async fetchAdjustments(page: number = 1) {
      const response: any = await $api(`/finance/adjustments?page=${page}`)
      this.adjustments = response.data.data
      return response.data
    },

    async createAdjustment(data: { account: string; amount: number; adjustmentDate?: string; note?: string }) {
      return await $api('/finance/adjustments', { method: 'post', body: data })
    },

    async deleteAdjustment(id: number) {
      return await $api(`/finance/adjustments/${id}`, { method: 'delete' })
    },

    // ── Yetkazib beruvchilar ──
    async fetchSuppliers() {
      const response: { data: Supplier[] } = await $api('/finance/suppliers')
      this.suppliers = response.data
      return this.suppliers
    },

    async createSupplier(data: { name: string; phone?: string; note?: string }) {
      const response: { data: Supplier } = await $api('/finance/suppliers', { method: 'post', body: data })
      return response.data
    },

    async updateSupplier(id: number, data: { name?: string; phone?: string; note?: string }) {
      return await $api(`/finance/suppliers/${id}`, { method: 'put', body: data })
    },

    async deleteSupplier(id: number) {
      return await $api(`/finance/suppliers/${id}`, { method: 'delete' })
    },

    // ── Yetkazib beruvchiga qarz (kreditorlik) ──
    async fetchDebts(page: number = 1, filters: { status?: string | null; supplierId?: number | null } = {}) {
      const response: any = await $api(`/finance/supplier-debts?${toQuery({ page, ...filters })}`)
      this.debts = response.data.data
      this.debtsTotal = response.data.meta.total
      this.debtsLimit = response.data.meta.limit
      this.debtsPage = page
    },

    async createDebt(data: {
      supplierId: number
      amount: number
      paidAmount?: number
      paymentType?: string
      debtDate?: string
      dueDate?: string
      note?: string
    }) {
      return await $api('/finance/supplier-debts', { method: 'post', body: data })
    },

    async addDebtPayment(id: number, data: { amount: number; paymentType?: string; paymentDate?: string; note?: string }) {
      return await $api(`/finance/supplier-debts/${id}/payments`, { method: 'post', body: data })
    },

    async cancelDebt(id: number) {
      return await $api(`/finance/supplier-debts/${id}/cancel`, { method: 'post' })
    },
  },
})
