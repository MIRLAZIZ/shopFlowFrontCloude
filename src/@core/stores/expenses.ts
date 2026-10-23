import { Expense, ExpenseCategory, ExpenseFilters, ExpenseSummary } from '@/interface/expense.interface'
import { defineStore } from 'pinia'

function toQuery(params: Record<string, any>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
  })
  return q.toString()
}

export const useExpensesStore = defineStore('expenses', {
  state: () => ({
    expenses: [] as Expense[],
    page: 1,
    total: 0,
    limit: 20,
    filteredTotal: 0, // filtrga mos BARCHA xarajatlar yig'indisi
    categories: [] as ExpenseCategory[],
    summary: null as ExpenseSummary | null,
  }),

  actions: {
    async fetchExpenses(page: number = 1, filters: ExpenseFilters = {}) {
      const response: any = await $api(`/expenses?${toQuery({ page, ...filters })}`)
      this.expenses = response.data.data
      this.total = response.data.meta.total
      this.limit = response.data.meta.limit
      this.filteredTotal = response.data.summary?.total ?? 0
      this.page = page
    },

    async fetchSummary(dateFrom?: string, dateTo?: string) {
      const response: { data: ExpenseSummary } = await $api(`/expenses/summary?${toQuery({ dateFrom, dateTo })}`)
      this.summary = response.data
    },

    async fetchCategories() {
      const response: { data: ExpenseCategory[] } = await $api('/expenses/categories')
      this.categories = response.data
      return this.categories
    },

    async createExpense(data: { categoryId: number; amount: number; paymentType?: string; expenseDate?: string; note?: string }) {
      return await $api('/expenses', { method: 'post', body: data })
    },

    async updateExpense(id: number, data: Partial<{ categoryId: number; amount: number; paymentType: string; expenseDate: string; note: string }>) {
      return await $api(`/expenses/${id}`, { method: 'put', body: data })
    },

    async deleteExpense(id: number) {
      return await $api(`/expenses/${id}`, { method: 'delete' })
    },

    async createCategory(data: { name: string; color?: string }) {
      return await $api('/expenses/categories', { method: 'post', body: data })
    },

    async updateCategory(id: number, data: { name?: string; color?: string }) {
      return await $api(`/expenses/categories/${id}`, { method: 'put', body: data })
    },

    async deleteCategory(id: number) {
      return await $api(`/expenses/categories/${id}`, { method: 'delete' })
    },
  },
})
