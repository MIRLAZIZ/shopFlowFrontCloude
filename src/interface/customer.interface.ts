export interface Customer {
    id: number
    fullName: string
    phone: string | null
    note: string | null
    totalDebt: number
    createdAt: string
    updatedAt?: string
}

export interface CustomerDebtOrderItem {
    productName: string
    unit: string | null
    quantity: number
    price: number
    discount: number
    total: number
}

export interface CustomerDebtHistoryDebt {
    id: number
    amount: number
    paidAmount: number
    remainingAmount: number
    status: 'open' | 'paid' | 'cancelled'
    dueDate: string | null
    note: string | null
    createdAt: string
    order: {
        id: number
        createdAt: string
        total: number
        paidAmount: number
        debtAmount: number
        status: string
        items: CustomerDebtOrderItem[]
    } | null
    payments: {
        id: number
        amount: number
        paymentType: string
        note: string | null
        createdAt: string
    }[]
}

export interface CustomerDebtHistory {
    customer: { id: number; fullName: string; phone: string | null }
    summary: { totalDebt: number; totalPaid: number; totalRemaining: number }
    debts: CustomerDebtHistoryDebt[]
}
