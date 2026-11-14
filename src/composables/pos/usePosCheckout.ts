import { ref, type Ref } from 'vue'
import { useOnline } from '@vueuse/core'
import { useCustomersStore } from '@/@core/stores/customers'
import { useOfflineStore } from '@/@core/stores/offline'
import { useOrdersStore } from '@/@core/stores/orders'
import { useToastStore } from '@/@core/stores/toast.store'
import { ReceiptData, receiptFromCart, receiptFromOrder } from '@/utils/receipt'
import { round2 } from '@/utils/posFormat'
import type { PosCart } from './usePosCart'
import type { PosPayment } from './usePosPayment'

interface Deps {
  cart: PosCart
  payment: PosPayment
  cashierName: Ref<string>
  receipt: Ref<ReceiptData | null>
  receiptDialog: Ref<boolean>
  autoPrint: Ref<boolean>
  runPrint: (openSettingsIfMissing: boolean) => Promise<void>
  loadRecent: () => void
}

export function usePosCheckout(d: Deps) {
  const isOnline = useOnline()
  const ordersStore = useOrdersStore()
  const customersStore = useCustomersStore()
  const offlineStore = useOfflineStore()
  const toastStore = useToastStore()

  const checkingOut = ref(false)
  const { cart, payment } = d

  async function checkout() {
    if (!cart.cart.value.length) return

    if (payment.debtAmount.value > 0 && !payment.customerId.value) {
      toastStore.error('Qarz uchun mijoz tanlanishi shart')
      payment.paymentTab.value = 'debt'
      return
    }

    checkingOut.value = true
    try {
      const linesWithBase = cart.cart.value.map(l => ({
        line: l,
        base: l.price * l.quantity - cart.lineDiscountAmount(l),
      }))
      const baseSum = linesWithBase.reduce((s, x) => s + x.base, 0) || 1

      const payload: any = {
        items: linesWithBase.map(({ line, base }) => {
          const proportionalShare = round2((cart.overallDiscountAmount.value * base) / baseSum)
          return {
            product_id: line.productId,
            quantity: line.quantity,
            discount: round2(cart.lineDiscountAmount(line) + proportionalShare) || undefined,
          }
        }),
        paymentType: payment.derivedPaymentType.value,
        paidAmount: payment.effectivePaid.value,
      }

      if (payment.derivedPaymentType.value === 'mixed') {
        payload.payments = [
          { type: 'cash', amount: Number(payment.mixedCash.value) || 0 },
          { type: 'card', amount: Number(payment.mixedCard.value) || 0 },
        ].filter(p => p.amount > 0)
      }

      if (payment.customerId.value) payload.customerId = payment.customerId.value

      // Savat tozalanishidan OLDIN chek uchun kerakli ma'lumotlarni olib qo'yamiz
      const customerName =
        customersStore.customers.find(c => c.id === payment.customerId.value)?.fullName ?? null

      if (!isOnline.value) {
        await offlineStore.queueOrder(payload)
        d.receipt.value = receiptFromCart({
          lines: cart.cart.value.map(l => ({
            name: l.name,
            unit: l.unit,
            price: l.price,
            quantity: l.quantity,
            discount: cart.lineDiscountAmount(l),
          })),
          overallDiscount: cart.overallDiscountAmount.value,
          paidAmount: Math.min(payment.effectivePaid.value, cart.grandTotal.value),
          debtAmount: payment.debtAmount.value,
          paymentType: payment.derivedPaymentType.value,
          cashier: d.cashierName.value,
          customerName,
        })
        d.receiptDialog.value = true
        toastStore.success('Chek oflayn saqlandi')
        cart.emptyActiveBasket()
        if (d.autoPrint.value) await d.runPrint(false)
        return
      }

      const order = await ordersStore.createOrder(payload)

      d.receipt.value = receiptFromOrder(order, { cashier: d.cashierName.value, customerName })
      d.receiptDialog.value = true
      toastStore.success('Chek muvaffaqiyatli yakunlandi')

      cart.emptyActiveBasket()
      d.loadRecent()
      if (d.autoPrint.value) await d.runPrint(false)
    } catch (error: any) {
      toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik yuz berdi')
    } finally {
      checkingOut.value = false
    }
  }

  return { checkingOut, checkout }
}
