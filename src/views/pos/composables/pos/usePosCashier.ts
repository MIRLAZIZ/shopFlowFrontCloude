import { onMounted, ref } from 'vue'
import { usePosStore } from '@/@core/stores/pos'

function decodeJwtPayload(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(base64))))
  } catch {
    return null
  }
}

// Kassir nomi (token'dan)
export function usePosCashier() {
  const posStore = usePosStore()
  const cashierName = ref('')

  onMounted(() => {
    const token = useCookie('accessToken').value // auto-import (Vuexy)
    if (token) {
      const payload = decodeJwtPayload(token)
      cashierName.value = payload?.username || ''
      posStore.ensureOwner(cashierName.value)
    }
  })

  return { cashierName }
}
