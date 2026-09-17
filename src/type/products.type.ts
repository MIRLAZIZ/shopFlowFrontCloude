export type ErrorType = {
    name: string | null;
    barcode: string | null;
    quick_code: string | null;
};

export type ProductFormType = {
    name: string | null;
    barcode: string | null;
    quick_code: string | null;
    max_quantity_notification: number | null;
    quantity: number | null;
    unit_id: number | null;
    // category_id: number | null;
    purchase_price: number | null;
    selling_price: number | null;
    deliveryCost: number | null;
    vatRate: number | null;
    costPrice: number | null;
    pricing_strategy: string | null;
};
