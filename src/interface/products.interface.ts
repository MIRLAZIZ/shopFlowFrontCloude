import { PriceHistory } from "./price-history.interface"


export interface Product {
    id: number
    name: string
    barcode: string
    quick_code: string | null
    max_quantity_notification: number | null
    price_history: PriceHistory[]
    quantity: number
    isLowStock: boolean
    unit: null | number | { id: number; name: string }
    price_mode: string
    selling_price?: number
    purchase_price?: number
    stock?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK'
    status?: boolean
}

export interface ProductBatch {
    quantity: number | null;
    purchase_price: number | null;
    selling_price: number | null;
    deliveryCost: number | null;
    vatRate: number | null;
    costPrice: number | null;
    product_id: number | null;
}


