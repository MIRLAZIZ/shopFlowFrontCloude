export interface StatisticsDashboard {
    period: 'today' | 'week' | 'month' | 'year'
    dateFrom: string
    dateTo: string
    totalRevenue: number
    totalProfit: number
    totalDiscount: number
    totalOrders: number
    averageOrderValue: number
    revenueByPaymentType: {
        cash: number
        card: number
        transfer: number
        mixed: number
    }
    dailyRevenue: { date: string; revenue: number }[]
    topProducts: {
        productId: number
        productName: string
        quantity: number
        revenue: number
        profit: number
    }[]
    totalOutstandingDebt: number
    lowStockCount: number
    outOfStockCount: number
}
