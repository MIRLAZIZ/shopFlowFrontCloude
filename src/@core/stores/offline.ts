import { offlineDb } from '@/utils/offlineDb'
import { $api } from '@/utils/api'
import { defineStore } from 'pinia'

interface PendingOrder {
  localId: string
  payload: any
  createdAt: string
  status: 'pending' | 'failed'
  errorMessage?: string
}

export const useOfflineStore = defineStore('offline', {
  state: () => ({
    pendingOrders: [] as PendingOrder[],
    syncing: false,
  }),

  getters: {
    pendingCount: state => state.pendingOrders.filter(o => o.status === 'pending').length,
    failedCount: state => state.pendingOrders.filter(o => o.status === 'failed').length,
  },

  actions: {
    async cacheProducts(products: any[]) {
      try {
        await offlineDb.putAll('products', products)
      } catch (e) {
        console.error('offline: mahsulotlarni keshlashda xato', e)
      }
    },

    async cacheCustomers(customers: any[]) {
      try {
        await offlineDb.putAll('customers', customers)
      } catch (e) {
        console.error('offline: mijozlarni keshlashda xato', e)
      }
    },

    async cacheDebts(debts: any[]) {
      try {
        await offlineDb.putAll('debts', debts)
      } catch (e) {
        console.error('offline: qarzlarni keshlashda xato', e)
      }
    },

    async getCachedProducts(): Promise<any[]> {
      try {
        return await offlineDb.getAll('products')
      } catch {
        return []
      }
    },

    async getCachedCustomers(): Promise<any[]> {
      try {
        return await offlineDb.getAll('customers')
      } catch {
        return []
      }
    },

    async getCachedDebts(): Promise<any[]> {
      try {
        return await offlineDb.getAll('debts')
      } catch {
        return []
      }
    },

    // Bitta mahsulot sotilganda mahalliy keshdagi qoldiqni ham kamaytiramiz
    // (server bilan qayta ulanguncha taxminiy ko'rsatish uchun)
    async decrementCachedStock(items: { product_id: number; quantity: number }[]) {
      try {
        const products = await offlineDb.getAll<any>('products')
        const map = new Map(products.map(p => [p.id, p]))
        for (const item of items) {
          const p = map.get(item.product_id)
          if (p) p.quantity = Math.max((p.quantity ?? 0) - item.quantity, 0)
        }
        await offlineDb.putAll('products', [...map.values()])
      } catch (e) {
        console.error('offline: qoldiqni yangilashda xato', e)
      }
    },

    async loadPending() {
      this.pendingOrders = await offlineDb.listPendingOrders()
    },

    async queueOrder(payload: any): Promise<string> {
      const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const order: PendingOrder = {
        localId,
        payload,
        createdAt: new Date().toISOString(),
        status: 'pending',
      }
      await offlineDb.queueOrder(order)
      await this.decrementCachedStock(payload.items)
      await this.loadPending()
      return localId
    },

    async syncPending() {
      if (this.syncing) return
      this.syncing = true
      try {
        await this.loadPending()
        for (const order of this.pendingOrders) {
          if (order.status !== 'pending') continue
          try {
            await $api('/orders', { method: 'post', body: order.payload })
            await offlineDb.removePendingOrder(order.localId)
          } catch (error: any) {
            order.status = 'failed'
            order.errorMessage =
              error?.data?.message || error?.response?._data?.message || 'Sinxronizatsiya xatosi'
            await offlineDb.updatePendingOrder(order)
          }
        }
        await this.loadPending()
      } finally {
        this.syncing = false
      }
    },

    async retryOne(localId: string) {
      const order = this.pendingOrders.find(o => o.localId === localId)
      if (!order) return
      order.status = 'pending'
      order.errorMessage = undefined
      await offlineDb.updatePendingOrder(order)
      await this.syncPending()
    },

    async discardOne(localId: string) {
      await offlineDb.removePendingOrder(localId)
      await this.loadPending()
    },
  },
})
