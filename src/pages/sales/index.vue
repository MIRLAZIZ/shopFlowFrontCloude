<script lang="ts" setup>
import { useOfflineStore } from '@/@core/stores/offline'
import { useToastStore } from '@/@core/stores/toast.store'
import PrinterSettingsDialog from '@/components/PrinterSettingsDialog.vue'
import { usePosBarcode } from '@/composables/pos/usePosBarcode'
import { usePosCart } from '@/composables/pos/usePosCart'
import { usePosCashier } from '@/composables/pos/usePosCashier'
import { usePosCheckout } from '@/composables/pos/usePosCheckout'
import { usePosHotkeys } from '@/composables/pos/usePosHotkeys'
import { usePosKeypad } from '@/composables/pos/usePosKeypad'
import { usePosOfflineCache } from '@/composables/pos/usePosOfflineCache'
import { usePosPayment } from '@/composables/pos/usePosPayment'
import { usePosPrinter } from '@/composables/pos/usePosPrinter'
import { usePosRecentOrders } from '@/composables/pos/usePosRecentOrders'
import type { ReceiptData } from '@/utils/receipt'
import PosBarcodeBar from '@/views/pos/components/pos/PosBarcodeBar.vue'
import PosCartCard from '@/views/pos/components/pos/PosCartCard.vue'
import PosKeypad from '@/views/pos/components/pos/PosKeypad.vue'
import PosPaymentDialog from '@/views/pos/components/pos/PosPaymentDialog.vue'
import PosPendingDialog from '@/views/pos/components/pos/PosPendingDialog.vue'
import PosProductSearch from '@/views/pos/components/pos/PosProductSearch.vue'
import PosReceiptDialog from '@/views/pos/components/pos/PosReceiptDialog.vue'
import PosRecentOrders from '@/views/pos/components/pos/PosRecentOrders.vue'
import PosTopBar from '@/views/pos/components/pos/PosTopBar.vue'
import { useOnline } from '@vueuse/core'
import { nextTick, onMounted, ref, watch } from 'vue'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const isOnline = useOnline()
const offlineStore = useOfflineStore()
const toastStore = useToastStore()

// ── Dialog holatlari ──
const receiptDialog = ref(false)
const pendingDialog = ref(false)
const printerDialog = ref(false)
const receipt = ref<ReceiptData | null>(null)

// ── Fokus (barcode doim tayyor turadi) ──
const barcodeQuery = ref('')
const barcodeBarRef = ref<InstanceType<typeof PosBarcodeBar>>()
const searchRef = ref<InstanceType<typeof PosProductSearch>>()

function focusBarcode() {
  if (anyDialogOpen()) return // modal ochiq bo'lsa fokusni tortib olmaymiz
  nextTick(() => barcodeBarRef.value?.focus())
}
function focusBarcodeSoon() {
  setTimeout(() => focusBarcode(), 150)
}

// ── Mantiq (composables) ──
const { cashierName } = usePosCashier()

// Savat avval, to'lov modali holati keyin — onReset closure orqali bog'lanadi
const cart = usePosCart({
  focusBarcode,
  onReset: () => {
    payment.paymentSectionOpen.value = false
    payment.paymentTab.value = 'pay'
  },
})
const payment = usePosPayment(cart.grandTotal)

const keypad = usePosKeypad({ cart, barcodeQuery, focusBarcode, focusBarcodeSoon })
const { onBarcodeKeydown, onBarcodeEnter } = usePosBarcode({ cart, keypad, barcodeQuery, focusBarcode })

const { printerConnected, autoPrint, printing, runPrint, printCurrentReceipt, reconnectPrinter } =
  usePosPrinter(receipt, printerDialog)

const { recentOrders, loadRecent } = usePosRecentOrders()
const { refreshOfflineCache } = usePosOfflineCache()

const { checkingOut, checkout } = usePosCheckout({
  cart, payment, cashierName, receipt, receiptDialog, autoPrint, runPrint, loadRecent,
})

const { anyDialogOpen } = usePosHotkeys({
  cart,
  keypad,
  dialogs: [payment.paymentSectionOpen, receiptDialog, pendingDialog, printerDialog],
  focusNameSearch: () => searchRef.value?.focus(),
  focusBarcodeSoon,
  openPayment: () => { payment.paymentSectionOpen.value = true },
})

// ── Qator tugmasi bosilganda tegishli maydonni nishonga olish ──
function onSelectLine(line: Parameters<typeof cart.targetLineQuantity>[0], kind: 'qty' | 'amount' | 'price' | 'discount') {
  if (kind === 'qty') cart.targetLineQuantity(line)
  else if (kind === 'amount') cart.targetLineAmount(line)
  else if (kind === 'price') cart.targetLinePrice(line)
  else cart.targetLineDiscount(line)
}

// ── Onlayn holat kuzatuvi ──
watch(isOnline, async online => {
  if (online) {
    toastStore.success('Internet tiklandi — sinxronlanmoqda...')
    await offlineStore.syncPending()
    await refreshOfflineCache()
    loadRecent()
  } else {
    toastStore.error('Internet uzildi — oflayn rejimda davom etilmoqda')
  }
})

onMounted(async () => {
  reconnectPrinter()
  await offlineStore.loadPending()
  await refreshOfflineCache()
  loadRecent()
  focusBarcode()
})
</script>

<template>
  <div class="pos-page">
    <PosTopBar :is-online="isOnline" :cashier-name="cashierName" :printer-connected="printerConnected"
      @open-pending="pendingDialog = true" @open-printer="printerDialog = true" />

    <PosBarcodeBar ref="barcodeBarRef" v-model="barcodeQuery" v-model:active-basket-id="cart.activeBasketId.value"
      :baskets="cart.baskets.value" @keydown="onBarcodeKeydown" @add-basket="cart.addBasket"
      @close-basket="cart.closeBasket" />

    <VRow>
      <VCol cols="12" md="8">
        <PosCartCard :title="cart.activeBasket.value.label" :cart="cart.cart.value"
          :active-target="cart.activeTarget.value" :gross-amount="cart.grossAmount" :subtotal="cart.subtotal.value"
          :line-discounts-total="cart.lineDiscountsTotal.value"
          :overall-discount-amount="cart.overallDiscountAmount.value" :grand-total="cart.grandTotal.value"
          @clear="cart.emptyActiveBasket" @pay="payment.paymentSectionOpen.value = true" @select="onSelectLine"
          @remove="cart.removeFromCart">
          <template #search>
            <PosProductSearch ref="searchRef" :is-online="isOnline" @pick="p => { cart.addToCart(p); focusBarcode() }"
              @blur="focusBarcodeSoon" />
          </template>
        </PosCartCard>
      </VCol>

      <VCol cols="12" md="4">
        <PosKeypad v-model:auto-print="autoPrint" :active-target-label="cart.activeTargetLabel.value"
          :has-active-line="!!cart.activeLine.value" @press-key="keypad.pressKey" @op="keypad.applyOp"
          @f6="keypad.applyF6" @f7="keypad.applyF7" @clear="keypad.clearBarcodeInput" @enter="onBarcodeEnter"
          @quick-qty="cart.quickAddQty" @reset-discounts="cart.resetAllDiscounts" />
      </VCol>
    </VRow>

    <PosPaymentDialog v-model="payment.paymentSectionOpen.value" v-model:tab="payment.paymentTab.value"
      v-model:auto-print="autoPrint" :grand-total="cart.grandTotal.value" :effective-paid="payment.effectivePaid.value"
      :change-amount="payment.changeAmount.value" :debt-amount="payment.debtAmount.value" :checking-out="checkingOut"
      :is-online="isOnline" @checkout="checkout" />

    <PosRecentOrders :orders="recentOrders" />

    <PosPendingDialog v-model="pendingDialog" :is-online="isOnline" />

    <PosReceiptDialog v-model="receiptDialog" :receipt="receipt" :printing="printing"
      @open-printer="printerDialog = true" @print="printCurrentReceipt" />

    <PrinterSettingsDialog v-model="printerDialog" />
  </div>
</template>
