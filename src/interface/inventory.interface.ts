export interface InventoryItem {
    id: number
    productId: number
    productName: string
    batchId: number
    systemQuantity: number
    countedQuantity: number | null
    difference: number | null
    countedAt?: string | null
    purchasePrice: number
}

export interface InventorySummary {
    totalItems: number
    countedItems: number
    pendingItems: number
    itemsWithDifference: number
    surplusQuantity: number
    shortageQuantity: number
    shortageValue: number
    surplusValue: number
}

export interface InventorySession {
    id: number
    status: 'open' | 'completed' | 'cancelled'
    startedBy: number
    completedBy: number | null
    completedAt: string | null
    note: string | null
    createdAt: string
    items: InventoryItem[]
    summary: InventorySummary
}

export interface InventorySessionListItem {
    id: number
    status: 'open' | 'completed' | 'cancelled'
    note: string | null
    createdAt: string
    completedAt: string | null
    totalItems: number
    countedItems: number
}
