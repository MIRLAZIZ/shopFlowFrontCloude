import { computed, ref, watch, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePosStore } from '@/@core/stores/pos'

// To'lov hisob-kitoblari (naqd / karta / qaytim / qarz)
export function usePosPayment(grandTotal: Ref<number>) {
  const posStore = usePosStore()
  const { mixedCash, mixedCard, mixedTouched, customerId } = storeToRefs(posStore)

  const paymentSectionOpen = ref(false)
  const paymentTab = ref<'pay' | 'debt'>('pay')

  watch(grandTotal, val => {
    if (!mixedTouched.value) mixedCash.value = val
  })

  const effectivePaid = computed(() => (Number(mixedCash.value) || 0) + (Number(mixedCard.value) || 0))
  const changeAmount = computed(() => Math.max(effectivePaid.value - grandTotal.value, 0))
  const debtAmount = computed(() => Math.max(grandTotal.value - effectivePaid.value, 0))

  const derivedPaymentType = computed(() => {
    const cash = Number(mixedCash.value) || 0
    const card = Number(mixedCard.value) || 0
    if (cash > 0 && card > 0) return 'mixed'
    if (card > 0) return 'card'
    return 'cash'
  })

  return {
    mixedCash, mixedCard, mixedTouched, customerId,
    paymentSectionOpen, paymentTab,
    effectivePaid, changeAmount, debtAmount, derivedPaymentType,
  }
}

export type PosPayment = ReturnType<typeof usePosPayment>
