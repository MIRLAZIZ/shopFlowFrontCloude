import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { CartLine, makeBasket, usePosStore } from '@/@core/stores/pos'
import { useToastStore } from '@/@core/stores/toast.store'
import { Product } from '@/interface/products.interface'
import { isCountUnit, unitLabelOf } from '@/utils/units'
import { round2, round3 } from '@/utils/posFormat'

export type TargetKind = 'qty' | 'amount' | 'price' | 'discount' | 'mixedCash' | 'mixedCard'
export interface NumericTarget {
  label: string
  kind: TargetKind
  lineId: number | null
}

interface Options {
  focusBarcode: () => void
  /** Savat tozalanganda (masalan to'lov modalini yopish uchun) */
  onReset?: () => void
}

// Savatlar (tablar), qatorlar, chegirmalar, jami summalar va
// raqamli panel nishoni (activeTarget / pending).
export function usePosCart({ focusBarcode, onReset }: Options) {
  const posStore = usePosStore()
  const toastStore = useToastStore()
  const { baskets, activeBasketId, nextBasketId, mixedCash, mixedCard, mixedTouched, customerId } =
    storeToRefs(posStore)

  // ── Raqamli panel nishoni ──
  const activeTarget = ref<NumericTarget | null>(null)
  const pending = ref('')

  // ── Savatlar ──
  const activeBasket = computed(
    () => baskets.value.find(b => b.id === activeBasketId.value) ?? baskets.value[0],
  )

  const cart = computed({
    get: () => activeBasket.value.cart,
    set: v => { activeBasket.value.cart = v },
  })
  const overallDiscountValue = computed({
    get: () => activeBasket.value.overallDiscountValue,
    set: v => { activeBasket.value.overallDiscountValue = v },
  })

  function addBasket() {
    const b = makeBasket(nextBasketId.value++)
    baskets.value.push(b)
    activeBasketId.value = b.id
    mixedTouched.value = false
    focusBarcode()
  }

  function emptyActiveBasket() {
    activeBasket.value.cart = []
    activeBasket.value.overallDiscountValue = 0
    activeBasket.value.note = ''
    mixedCash.value = 0
    mixedCard.value = 0
    mixedTouched.value = false
    customerId.value = null
    activeTarget.value = null
    pending.value = ''
    onReset?.()
  }

  function closeBasket(id: number) {
    if (baskets.value.length === 1) {
      emptyActiveBasket()
      return
    }
    const idx = baskets.value.findIndex(b => b.id === id)
    if (idx === -1) return
    baskets.value.splice(idx, 1)
    if (activeBasketId.value === id) {
      activeBasketId.value = baskets.value[Math.max(idx - 1, 0)].id
    }
  }

  // ── Faol qator ──
  const activeTargetLabel = computed(() => (activeTarget.value ? activeTarget.value.label : 'Maydon tanlanmagan'))
  const activeLine = computed(() =>
    activeTarget.value?.lineId != null
      ? cart.value.find(l => l.productId === activeTarget.value!.lineId) ?? null
      : null,
  )

  function isTarget(line: CartLine | null, kind: TargetKind) {
    if (!activeTarget.value) return false
    if (activeTarget.value.kind !== kind) return false
    return line ? activeTarget.value.lineId === line.productId : activeTarget.value.lineId === null
  }

  function bindTarget(target: NumericTarget) {
    activeTarget.value = target
    pending.value = ''
  }

  const targetLineQuantity = (line: CartLine) =>
    bindTarget({ label: `${line.name} — miqdor`, kind: 'qty', lineId: line.productId })
  const targetLineAmount = (line: CartLine) =>
    bindTarget({ label: `${line.name} — summa (÷ orqali)`, kind: 'amount', lineId: line.productId })
  const targetLinePrice = (line: CartLine) =>
    bindTarget({ label: `${line.name} — narx (× orqali)`, kind: 'price', lineId: line.productId })
  const targetLineDiscount = (line: CartLine) =>
    bindTarget({ label: `${line.name} — chegirma (F7 orqali)`, kind: 'discount', lineId: line.productId })

  // ── Savat qatorlari ──
  function addToCart(product: Product, exactQuantity?: number) {
    const availableQty = product.quantity ?? 0
    if (availableQty <= 0) {
      toastStore.error('Bu mahsulot omborda qolmagan')
      return
    }

    const existing = cart.value.find(l => l.productId === product.id)
    if (existing) {
      // Vaznli shtrix-kod skanerlansa — aniq vaznga QO'SHILADI, aks holda +1
      const addQty = exactQuantity ?? 1
      if (existing.quantity + addQty > existing.availableQuantity) {
        toastStore.error("Omborda shuncha mahsulot yo'q")
        return
      }
      existing.quantity = round3(existing.quantity + addQty)
      targetLineQuantity(existing)
    } else {
      const line: CartLine = {
        productId: product.id,
        name: product.name,
        unit: unitLabelOf(product),
        price: product.selling_price ?? 0,
        quantity: exactQuantity ?? 1,
        discount: 0,
        availableQuantity: availableQty,
      }
      cart.value = [...cart.value, line]
      targetLineQuantity(line)
    }
  }

  function removeFromCart(productId: number) {
    cart.value = cart.value.filter(l => l.productId !== productId)
    if (activeTarget.value?.lineId === productId) activeTarget.value = null
  }

  function clampQty(line: CartLine) {
    // Dona kabi sanaladigan birliklarda miqdor butun; kg, litr, metrda kasr mumkin.
    if (isCountUnit(line.unit)) line.quantity = Math.max(Math.round(line.quantity || 0), 1)
    else if (!line.quantity || line.quantity <= 0) line.quantity = 0.001
    if (line.quantity > line.availableQuantity) {
      line.quantity = line.availableQuantity
      toastStore.error("Omborda shuncha mahsulot yo'q")
    }
  }

  function stepQty(line: CartLine, delta: number) {
    line.quantity = round3((Number(line.quantity) || 0) + delta)
    clampQty(line)
  }

  function quickAddQty(n: number) {
    if (!activeLine.value) return
    stepQty(activeLine.value, n)
  }

  function grossAmount(line: CartLine) {
    return round2(line.price * line.quantity)
  }

  function onAmountInput(line: CartLine, value: number | string) {
    const amount = Number(value)
    if (!line.price || Number.isNaN(amount)) return
    line.quantity = round3(amount / line.price)
    clampQty(line)
  }

  function lineDiscountAmount(line: CartLine) {
    return Math.min(Math.max(line.discount || 0, 0), grossAmount(line))
  }

  // ── Jami summalar ──
  const subtotal = computed(() => cart.value.reduce((sum, l) => sum + l.price * l.quantity, 0))
  const lineDiscountsTotal = computed(() =>
    round2(cart.value.reduce((sum, l) => sum + lineDiscountAmount(l), 0)),
  )
  const overallDiscountAmount = computed(() => {
    const base = Math.max(subtotal.value - lineDiscountsTotal.value, 0)
    return Math.min(overallDiscountValue.value || 0, base)
  })
  const grandTotal = computed(() =>
    Math.max(subtotal.value - lineDiscountsTotal.value - overallDiscountAmount.value, 0),
  )

  function resetAllDiscounts() {
    cart.value.forEach(l => { l.discount = 0 })
    overallDiscountValue.value = 0
    toastStore.success('Barcha chegirmalar bekor qilindi')
  }

  return {
    // baskets
    baskets, activeBasketId, activeBasket, addBasket, closeBasket, emptyActiveBasket,
    // cart
    cart, overallDiscountValue, addToCart, removeFromCart, stepQty, quickAddQty,
    clampQty, grossAmount, onAmountInput, lineDiscountAmount,
    // totals
    subtotal, lineDiscountsTotal, overallDiscountAmount, grandTotal, resetAllDiscounts,
    // numeric target
    activeTarget, pending, activeTargetLabel, activeLine, isTarget, bindTarget,
    targetLineQuantity, targetLineAmount, targetLinePrice, targetLineDiscount,
  }
}

export type PosCart = ReturnType<typeof usePosCart>
