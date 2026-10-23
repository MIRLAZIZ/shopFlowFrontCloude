export interface ExpenseCategory {
    id: number
    name: string
    color: string | null
}

export interface Expense {
    id: number
    amount: number
    paymentType: 'cash' | 'card' | 'transfer'
    expenseDate: string // YYYY-MM-DD
    note: string | null
    createdBy: number
    createdByName: string | null
    createdAt: string
    category: ExpenseCategory
}

export interface ExpenseSummary {
    total: number
    count: number
    byCategory: { categoryId: number; name: string; color: string | null; total: number; count: number }[]
    byPaymentType: { paymentType: string; total: number }[]
    daily: { date: string; total: number }[]
}

export interface ExpenseFilters {
    categoryId?: number | null
    paymentType?: string | null
    dateFrom?: string
    dateTo?: string
    search?: string
}
