import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// Kassa (POS) holati: savatlar, to'lov maydonlari, tanlangan mijoz.
//   • Pinia store'da turgani uchun boshqa sahifaga o'tib qaytganda joyida qoladi
//   • localStorage'ga yozib borilgani uchun brauzer yangilanganda (refresh),
//     hatto internet yo'q paytda ham yo'qolmaydi

export interface CartLine {
  productId: number
  name: string
  unit: string // o'lchov birligi: kg, dona, litr...
  price: number
  quantity: number
  discount: number
  availableQuantity: number
}

export interface Basket {
  id: number
  label: string
  cart: CartLine[]
  overallDiscountValue: number
  note: string
}

export function makeBasket(id: number): Basket {
  return {
    id,
    label: `Savat ${id}`,
    cart: [],
    overallDiscountValue: 0,
    note: '',
  }
}

const STORAGE_KEY = 'shopflow-pos-state'

interface PersistedState {
  owner: string
  baskets: Basket[]
  activeBasketId: number
  nextBasketId: number
  mixedCash: number
  mixedCard: number
  mixedTouched: boolean
  customerId: number | null
}

function loadSaved(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.baskets) || !data.baskets.length) return null

    // Eski/buzilgan yozuvlardan himoya: har bir qatorni tekshirib to'ldiramiz
    data.baskets = data.baskets.map((b: any) => ({
      id: Number(b.id),
      label: String(b.label ?? `Savat ${b.id}`),
      overallDiscountValue: Number(b.overallDiscountValue) || 0,
      note: String(b.note ?? ''),
      cart: (Array.isArray(b.cart) ? b.cart : [])
        .filter((l: any) => l && l.productId)
        .map((l: any) => ({
          productId: Number(l.productId),
          name: String(l.name ?? ''),
          unit: String(l.unit ?? 'dona'),
          price: Number(l.price) || 0,
          quantity: Number(l.quantity) || 1,
          discount: Number(l.discount) || 0,
          availableQuantity: Number(l.availableQuantity) || 0,
        })),
    }))
    return data
  } catch {
    return null
  }
}

export const usePosStore = defineStore('pos', () => {
  const saved = loadSaved()

  const owner = ref<string>(saved?.owner ?? '')
  const baskets = ref<Basket[]>(saved?.baskets?.length ? (saved.baskets as Basket[]) : [makeBasket(1)])

  const savedActive = saved?.activeBasketId
  const activeBasketId = ref<number>(
    baskets.value.some(b => b.id === savedActive) ? (savedActive as number) : baskets.value[0].id,
  )
  // Keyingi savat ID'si doim mavjud ID'lardan katta bo'lishi shart
  const nextBasketId = ref<number>(
    Math.max(saved?.nextBasketId ?? 1, Math.max(...baskets.value.map(b => b.id)) + 1),
  )

  const mixedCash = ref<number>(saved?.mixedCash ?? 0)
  const mixedCard = ref<number>(saved?.mixedCard ?? 0)
  const mixedTouched = ref<boolean>(saved?.mixedTouched ?? false)
  const customerId = ref<number | null>(saved?.customerId ?? null)

  function snapshot(): PersistedState {
    return {
      owner: owner.value,
      baskets: baskets.value,
      activeBasketId: activeBasketId.value,
      nextBasketId: nextBasketId.value,
      mixedCash: mixedCash.value,
      mixedCard: mixedCard.value,
      mixedTouched: mixedTouched.value,
      customerId: customerId.value,
    }
  }

  function persistNow() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()))
    } catch {
      // localStorage to'lgan yoki taqiqlangan — xotiradagi holat baribir ishlaydi
    }
  }

  let timer: ReturnType<typeof setTimeout> | null = null
  watch(
    [owner, baskets, activeBasketId, nextBasketId, mixedCash, mixedCard, mixedTouched, customerId],
    () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(persistNow, 250)
    },
    { deep: true },
  )

  // Sahifa yopilayotganda / yangilanayotganda oxirgi o'zgarishlar ham saqlansin
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', persistNow)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') persistNow()
    })
  }

  function reset() {
    baskets.value = [makeBasket(1)]
    activeBasketId.value = 1
    nextBasketId.value = 2
    mixedCash.value = 0
    mixedCard.value = 0
    mixedTouched.value = false
    customerId.value = null
  }

  // Boshqa kassir kirgan bo'lsa — oldingi kassirning savatlari ko'rinmasin
  function ensureOwner(username: string) {
    if (!username) return
    if (owner.value && owner.value !== username) reset()
    owner.value = username
  }

  return {
    owner,
    baskets,
    activeBasketId,
    nextBasketId,
    mixedCash,
    mixedCard,
    mixedTouched,
    customerId,
    reset,
    ensureOwner,
    persistNow,
  }
})
