import type { Ref } from 'vue'
import { useOnline } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useOfflineStore } from '@/@core/stores/offline'
import { useProductsStore } from '@/@core/stores/products'
import { useToastStore } from '@/@core/stores/toast.store'
import { Product } from '@/interface/products.interface'
import { $api } from '@/utils/api'
import { unitLabelOf } from '@/utils/units'
import { decodeQuantityBarcode, decodeReceiptBarcode } from '@/utils/weightBarcode'
import type { PosCart } from './usePosCart'
import type { PosKeypad } from './usePosKeypad'

interface Deps {
  cart: PosCart
  keypad: PosKeypad
  barcodeQuery: Ref<string>
  focusBarcode: () => void
}

// Barcode input — "buyruq qatori": shtrix-kod/qisqa kod yoki raqam + amal.
export function usePosBarcode({ cart, keypad, barcodeQuery, focusBarcode }: Deps) {
  const router = useRouter()
  const isOnline = useOnline()
  const productsStore = useProductsStore()
  const offlineStore = useOfflineStore()
  const toastStore = useToastStore()

  let lastBarcodeKeyAt = 0
  function onBarcodeKeydown(e: KeyboardEvent) {
    const now = Date.now()
    const fast = now - lastBarcodeKeyAt < 40 // skaner belgilarni juda tez yuboradi
    lastBarcodeKeyAt = now

    if (e.key === 'Enter') {
      e.preventDefault()
      onBarcodeEnter()
      return
    }
    if (!['+', '-', '*', '/'].includes(e.key) || fast) return

    const raw = (barcodeQuery.value ?? '').trim().replace(',', '.')
    const numeric = /^\d+(\.\d+)?$/.test(raw)
    if (raw !== '' && !numeric) return

    e.preventDefault()
    const line = cart.activeLine.value
    if (!line) {
      toastStore.error('Avval savatdan mahsulotni tanlang')
      return
    }
    if (raw === '') {
      if (e.key === '+') cart.stepQty(line, 1)
      else if (e.key === '-') cart.stepQty(line, -1)
      return
    }
    barcodeQuery.value = ''
    cart.pending.value = raw
    keypad.applyOp(e.key as '+' | '-' | '*' | '/')
  }

  async function onBarcodeEnter() {
    const value = barcodeQuery.value?.trim()
    if (!value) return

    // 🏷️ Vaznli shtrix-kod
    const decoded = decodeQuantityBarcode(value)
    if (decoded) {
      try {
        let product: Product | null = null
        if (!isOnline.value) {
          const cached = await offlineStore.getCachedProducts()
          product = cached.find((p: any) => p.id === decoded.productId) ?? null
        } else {
          const res: any = await $api(`/products/${decoded.productId}`)
          product = res?.data ?? null
        }
        if (!product) {
          toastStore.error('Shtrix-koddagi mahsulot topilmadi')
        } else {
          cart.addToCart(product, decoded.quantity)
          toastStore.success(`${product.name} — ${decoded.quantity} ${unitLabelOf(product)} qo'shildi`)
        }
      } catch {
        toastStore.error('Shtrix-koddagi mahsulot topilmadi')
      }
      barcodeQuery.value = ''
      focusBarcode()
      return
    }

    // 🧾 Chek shtrix-kodi
    const receiptId = decodeReceiptBarcode(value)
    if (receiptId) {
      barcodeQuery.value = ''
      router.push({ path: '/receipts', query: { order: String(receiptId) } })
      return
    }

    if (!isOnline.value) {
      const cached = await offlineStore.getCachedProducts()
      const match = cached.find((p: any) => p.barcode === value || p.quick_code === value)
      if (match) {
        cart.addToCart(match)
        barcodeQuery.value = ''
      } else {
        toastStore.error('Mahsulot topilmadi (oflayn kesh)')
      }
      focusBarcode()
      return
    }

    try {
      const byBarcode: any = await productsStore.searchProduct({ barcode: value })
      if (byBarcode?.data?.length === 1) {
        cart.addToCart(byBarcode.data[0])
        barcodeQuery.value = ''
        focusBarcode()
        return
      }
      const byQuick: any = await productsStore.searchProduct({ quickCode: value })
      if (byQuick?.data?.length === 1) {
        cart.addToCart(byQuick.data[0])
        barcodeQuery.value = ''
        focusBarcode()
        return
      }
      toastStore.error('Mahsulot topilmadi')
    } catch {
      toastStore.error('Mahsulot topilmadi')
    }
    focusBarcode()
  }

  return { onBarcodeKeydown, onBarcodeEnter }
}
