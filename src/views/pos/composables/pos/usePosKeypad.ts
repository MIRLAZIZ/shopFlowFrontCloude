import type { Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePosStore } from '@/@core/stores/pos'
import { round3 } from '@/utils/posFormat'
import type { PosCart } from './usePosCart'

interface Deps {
  cart: PosCart
  barcodeQuery: Ref<string>
  focusBarcode: () => void
  focusBarcodeSoon: () => void
}

// Raqamli panel: raqam kiritish, + − × ÷, F6 / F7
export function usePosKeypad({ cart, barcodeQuery, focusBarcode, focusBarcodeSoon }: Deps) {
  const { mixedCash, mixedCard, mixedTouched } = storeToRefs(usePosStore())

  // Barcode inputdagi raqamni "pending" qiymatga ko'chirish
  function consumeBarcodeAsPending() {
    const raw = (barcodeQuery.value ?? '').trim().replace(',', '.')
    if (/^\d+(\.\d+)?$/.test(raw)) {
      cart.pending.value = raw
      barcodeQuery.value = ''
    }
  }

  function pressKey(key: string) {
    const current = barcodeQuery.value ?? ''
    barcodeQuery.value = key === '⌫' ? current.slice(0, -1) : current + key
    focusBarcode()
  }

  function clearBarcodeInput() {
    barcodeQuery.value = ''
    cart.pending.value = ''
    focusBarcode()
  }

  const pendingNumber = () => Number(cart.pending.value) || 0

  function applyOp(op: '+' | '-' | '*' | '/') {
    if (!cart.pending.value) consumeBarcodeAsPending()
    const n = pendingNumber()

    // Naqd/Karta maydonlari: qiymat to'g'ridan-to'g'ri o'sha maydonga yoziladi
    if (cart.activeTarget.value?.kind === 'mixedCash') {
      mixedCash.value = n
      mixedTouched.value = true
      cart.pending.value = ''
      return
    }
    if (cart.activeTarget.value?.kind === 'mixedCard') {
      mixedCard.value = n
      mixedTouched.value = true
      cart.pending.value = ''
      return
    }

    const line = cart.activeLine.value
    if (!line) return

    if (op === '+') {
      line.quantity = round3(line.quantity + n)
      cart.clampQty(line)
    } else if (op === '-') {
      line.quantity = round3(line.quantity - n)
      cart.clampQty(line)
    } else if (op === '*') {
      line.price = n
    } else if (op === '/') {
      cart.onAmountInput(line, n)
    }
    cart.pending.value = ''
    focusBarcodeSoon()
  }

  function applyF6() {
    if (!cart.pending.value) consumeBarcodeAsPending()
    cart.overallDiscountValue.value = pendingNumber()
    cart.pending.value = ''
    focusBarcodeSoon()
  }

  function applyF7() {
    if (!cart.pending.value) consumeBarcodeAsPending()
    const line = cart.activeLine.value
    if (!line) return
    line.discount = Math.min(Math.max(pendingNumber(), 0), cart.grossAmount(line))
    cart.pending.value = ''
    focusBarcodeSoon()
  }

  return { consumeBarcodeAsPending, pressKey, clearBarcodeInput, applyOp, applyF6, applyF7 }
}

export type PosKeypad = ReturnType<typeof usePosKeypad>
