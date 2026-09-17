export interface DebtPayment {
    id: number
    amount: number
    paymentType: string
    note: string | null
    createdBy: number
    createdAt: string
}

export interface Debt {
    id: number
    amount: number
    paidAmount: number
    remainingAmount: number
    dueDate: string | null
    status: 'open' | 'paid' | 'cancelled'
    note: string | null
    createdAt: string
    updatedAt?: string
    customer: {
        id: number
        fullName: string
        phone: string | null
    }
    order: {
        id: number
    } | null
    payments?: DebtPayment[]
}
