export interface Customer {
    id: number
    fullName: string
    phone: string | null
    note: string | null
    totalDebt: number
    createdAt: string
    updatedAt?: string
}
