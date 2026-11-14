import { nextTick, onMounted, onUnmounted, watch, type Ref } from 'vue'
import type { PosCart } from './usePosCart'
import type { PosKeypad } from './usePosKeypad'

interface Deps {
  cart: PosCart
  keypad: PosKeypad
  dialogs: Ref<boolean>[]
  focusNameSearch: () => void
  focusBarcodeSoon: () => void
  openPayment: () => void
}

export function usePosHotkeys(d: Deps) {
  let lastDialogClosedAt = 0
  const anyDialogOpen = () => d.dialogs.some(x => x.value)

  // Modal yopilganda fokusni barcode'ga qaytarish
  watch(
    d.dialogs,
    (now, before) => {
      if (before.some((was, i) => was && !now[i])) {
        lastDialogClosedAt = Date.now()
        nextTick(() => d.focusBarcodeSoon())
      }
    },
    { flush: 'sync' },
  )

  function onKeydown(e: KeyboardEvent) {
    if (anyDialogOpen()) return

    const tag = (document.activeElement as HTMLElement)?.tagName
    const isRealTextInput = tag === 'INPUT' || tag === 'TEXTAREA'

    // Fizik klaviaturadan raqam/amal: faqat matn maydoni fokusda bo'lmaganda
    if (!isRealTextInput && d.cart.activeTarget.value) {
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); d.keypad.pressKey(e.key); return }
      if (e.key === 'Backspace') { e.preventDefault(); d.keypad.pressKey('⌫'); return }
      if (['+', '-', '*', '/'].includes(e.key)) {
        e.preventDefault()
        d.keypad.applyOp(e.key as '+' | '-' | '*' | '/')
        return
      }
    }

    if (e.key === 'F2') {
      e.preventDefault()
      d.focusNameSearch()
    } else if (e.key === 'F4') {
      e.preventDefault()
      if (d.cart.cart.value.length) d.openPayment()
    } else if (e.key === 'F6') {
      e.preventDefault()
      d.keypad.applyF6()
    } else if (e.key === 'F7') {
      e.preventDefault()
      d.keypad.applyF7()
    } else if (e.key === 'Escape') {
      // Modal Esc bilan endigina yopilgan bo'lsa — savatni tozalamaymiz
      if (Date.now() - lastDialogClosedAt < 300) return
      e.preventDefault()
      if (d.cart.cart.value.length) d.cart.emptyActiveBasket()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  return { anyDialogOpen }
}
