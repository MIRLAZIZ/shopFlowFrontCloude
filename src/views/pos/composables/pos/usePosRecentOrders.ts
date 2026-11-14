import { ref } from 'vue'
import { useOnline } from '@vueuse/core'
import { useOrdersStore } from '@/@core/stores/orders'
import { Order } from '@/interface/order.interface'

export function usePosRecentOrders() {
  const ordersStore = useOrdersStore()
  const isOnline = useOnline()
  const recentOrders = ref<Order[]>([])

  async function loadRecent() {
    if (!isOnline.value) return
    try {
      await ordersStore.fetchOrders(1)
      recentOrders.value = ordersStore.orders.slice(0, 5)
    } catch {
      // jim turadi
    }
  }

  return { recentOrders, loadRecent }
}
