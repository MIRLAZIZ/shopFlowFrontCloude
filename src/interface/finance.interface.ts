export interface CashBreakdown {
    balance: number
    opening: number
    salesIn: number
    debtPaymentsIn: number
    adjustments: number
    expensesOut: number
    suppliersOut: number
    returnsOut: number
}

export interface AssetsReport {
    asOf: string
    opening: { openingCash: number; openingBank: number; startDate: string } | null
    assets: {
        inventory: { cost: number; retail: number; products: number }
        cash: CashBreakdown
        bank: CashBreakdown
        money: number
        receivables: { total: number; customers: number }
        totalCurrent: number
    }
    liabilities: {
        payables: { total: number; suppliers: number }
        total: number
    }
    netAssets: number
}

export interface Supplier {
    id: number
    name: string
    phone: string | null
    note: string | null
    payable: number
}

export interface SupplierPayment {
    id: number
    amount: number
    paymentType: string
    paymentDate: string
    note: string | null
}

export interface SupplierDebt {
    id: number
    supplier: { id: number; name: string; phone: string | null }
    amount: number
    paidAmount: number
    remainingAmount: number
    debtDate: string
    dueDate: string | null
    status: 'open' | 'paid' | 'cancelled'
    note: string | null
    createdAt: string
    payments: SupplierPayment[]
}

export interface CashAdjustment {
    id: number
    account: 'cash' | 'bank'
    amount: number
    adjustmentDate: string
    note: string | null
    createdByName: string | null
}
