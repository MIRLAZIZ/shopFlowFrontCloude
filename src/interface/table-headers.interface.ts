// interface/table-headers.interface.ts

export interface TableHeader<T> {
    title: string
    key: keyof T | 'actions' | 'data-table-select' | 'data-table-expand' // ✅
    sortable?: boolean
    align?: 'start' | 'center' | 'end'
    width?: string | number
}
