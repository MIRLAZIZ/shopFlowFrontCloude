export interface OrderItem {
    id: number
    quantity: number
    selling_price: number
    purchase_price?: number
    discount: number
    total: number
    returnedQuantity?: number
    product: {
        id: number
        name: string
    }
}

export interface OrderReturn {
    id: number
    totalRefundAmount: number
    appliedToDebt: number
    cashRefundAmount: number
    reason: string | null
    createdAt: string
    items: {
        productId: number
        productName: string
        quantity: number
        refundAmount: number
    }[]
}

export interface Order {
    id: number
    subtotal: number
    discount: number
    total: number
    paidAmount: number
    debtAmount: number
    paymentType: 'cash' | 'card' | 'transfer' | 'mixed'
    paymentBreakdown: { type: string; amount: number }[] | null
    customerId: number | null
    status: 'completed' | 'cancelled'
    createdAt: string
    updatedAt?: string
    items: OrderItem[]
    user?: {
        id: number
        name: string
    }
}

export interface CartLine {
    productId: number
    name: string
    barcode?: string | null
    quick_code?: string | null
    unitName?: string | null
    price: number
    quantity: number
    discount: number
    availableQuantity: number
}
