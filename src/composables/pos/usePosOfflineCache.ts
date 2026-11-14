import { useOnline } from '@vueuse/core'
import { useOfflineStore } from '@/@core/stores/offline'
import { $api } from '@/utils/api'

export function usePosOfflineCache() {
  const isOnline = useOnline()
  const offlineStore = useOfflineStore()

  async function refreshOfflineCache() {
    if (!isOnline.value) return
    try {
      const [productsRes, customersRes, debtsRes] = await Promise.all([
        $api('/products?page=1&limit=1000') as Promise<any>,
        $api('/customers?page=1&limit=1000') as Promise<any>,
        $api('/debts?page=1&limit=1000&status=open') as Promise<any>,
      ])
      await offlineStore.cacheProducts(productsRes?.data?.data ?? [])
      await offlineStore.cacheCustomers(customersRes?.data?.data ?? [])
      await offlineStore.cacheDebts(debtsRes?.data?.data ?? [])
    } catch {
      // jim turadi
    }
  }

  return { refreshOfflineCache }
}
