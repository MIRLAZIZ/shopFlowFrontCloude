<template>
  <div>
    <VCard title="Cheklar" class="mb-6">
      <template #append>
        <VBtn variant="tonal" prepend-icon="tabler-printer" @click="printerDialog = true">
          Printer
        </VBtn>
      </template>

      <VCardText class="pb-0">
        <VTextField
          ref="scanRef"
          v-model="scanCode"
          prepend-inner-icon="tabler-barcode"
          placeholder="Chek shtrix-kodini skanerlang yoki chek raqamini yozing..."
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
          class="receipt-scan"
          @keydown.enter.prevent="onScan"
        />
      </VCardText>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="6" md="3">
            <AppTextField
              v-model="filters.orderId"
              type="number"
              label="Chek raqami (#)"
              clearable
              @update:model-value="debouncedSearch"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppTextField
              v-model="filters.productName"
              label="Mahsulot nomi"
              clearable
              @update:model-value="debouncedSearch"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <AppSelect
              v-model="filters.paymentType"
              :items="paymentTypeOptions"
              item-title="title"
              item-value="value"
              label="To'lov turi"
              clearable
              @update:model-value="refresh(1)"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <AppSelect
              v-model="filters.status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="Holati"
              clearable
              @update:model-value="refresh(1)"
            />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <AppTextField
              v-model="filters.date"
              type="date"
              label="Sana"
              clearable
              @update:model-value="refresh(1)"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VTable>
        <thead>
          <tr>
            <th>№</th>
            <th>Vaqt</th>
            <th>Kassir</th>
            <th>To'lov turi</th>
            <th class="text-end">Summa</th>
            <th class="text-end">Qarz</th>
            <th>Holati</th>
            <th style="width: 100px">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in ordersStore.orders" :key="o.id">
            <td>#{{ o.id }}</td>
            <td>{{ formatDate(o.createdAt) }}</td>
            <td>{{ o.user?.name || '-' }}</td>
            <td>{{ paymentLabel(o.paymentType) }}</td>
            <td class="text-end">{{ formatMoney(o.total) }} so'm</td>
            <td class="text-end">
              <span v-if="o.debtAmount > 0" class="text-error">{{ formatMoney(o.debtAmount) }}</span>
              <span v-else>-</span>
            </td>
            <td>
              <VChip :color="o.status === 'completed' ? 'success' : 'error'" size="small">
                {{ o.status === 'completed' ? 'Yakunlangan' : 'Bekor qilingan' }}
              </VChip>
            </td>
            <td>
              <IconBtn size="small" @click="openDetail(o.id)">
                <VIcon icon="tabler-eye" />
              </IconBtn>
              <IconBtn
                v-if="o.status === 'completed'"
                size="small"
                @click="openCancel(o)"
              >
                <VIcon icon="tabler-x" color="error" />
              </IconBtn>
            </td>
          </tr>
          <tr v-if="!ordersStore.orders.length">
            <td colspan="8" class="text-center text-medium-emphasis py-6">Cheklar topilmadi</td>
          </tr>
        </tbody>
      </VTable>

      <div v-if="ordersStore.total > 0" class="d-flex justify-center pa-4">
        <VPagination
          v-model="page"
          :length="Math.max(Math.ceil(ordersStore.total / ordersStore.limit), 1)"
          :total-visible="6"
          @update:model-value="refresh"
        />
      </div>
    </VCard>

    <!-- Chek tafsiloti -->
    <VDialog v-model="detailDialog" max-width="420" scrollable>
      <VCard v-if="detailOrder">
        <VCardText>
          <ReceiptPreview :receipt="detailReceipt" />

          <!-- Avval qilingan qaytarishlar -->
          <div v-if="orderReturns.length" class="mt-4">
            <VDivider class="mb-2" />
            <div class="text-caption text-medium-emphasis mb-1">Qaytarishlar tarixi</div>
            <div v-for="r in orderReturns" :key="r.id" class="text-caption mb-2">
              <div class="d-flex justify-space-between">
                <span>{{ formatDate(r.createdAt) }}</span>
                <span class="font-weight-medium">{{ formatMoney(r.totalRefundAmount) }} so'm</span>
              </div>
              <div v-for="it in r.items" :key="it.productId" class="text-medium-emphasis">
                {{ it.productName }} — {{ formatQty(it.quantity) }} dona ({{ formatMoney(it.refundAmount) }} so'm)
              </div>
            </div>
          </div>
        </VCardText>
        <VCardText class="d-flex justify-end gap-2 flex-wrap">
          <VBtn
            v-if="detailOrder.status === 'completed' && hasReturnableItems"
            variant="tonal"
            color="warning"
            prepend-icon="tabler-rotate"
            @click="openReturn"
          >
            Qaytarish
          </VBtn>
          <VBtn variant="tonal" prepend-icon="tabler-printer" :loading="printing" @click="printDetail">
            Chop etish
          </VBtn>
          <VBtn color="primary" @click="detailDialog = false">Yopish</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Qisman qaytarish -->
    <VDialog v-model="returnDialog" max-width="480">
      <VCard title="Mahsulotlarni qaytarish">
        <VCardText v-if="detailOrder">
          <VTable density="compact" class="mb-3">
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th class="text-end">Sotilgan</th>
                <th class="text-end">Qaytarilgan</th>
                <th style="width: 110px">Qaytariladi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detailOrder.items" :key="item.id">
                <td>{{ item.product.name }}</td>
                <td class="text-end">{{ formatQty(item.quantity) }}</td>
                <td class="text-end">{{ formatQty(item.returnedQuantity || 0) }}</td>
                <td>
                  <VTextField
                    v-model.number="returnQty[item.id]"
                    type="number"
                    density="compact"
                    hide-details
                    min="0"
                    :max="remainingQty(item)"
                    :disabled="remainingQty(item) <= 0"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>

          <AppTextField v-model="returnReason" label="Sababi (ixtiyoriy)" class="mb-3" />

          <div class="d-flex justify-space-between text-body-2">
            <span class="text-medium-emphasis">Qaytariladigan summa:</span>
            <span class="font-weight-medium">{{ formatMoney(returnPreviewAmount) }} so'm</span>
          </div>
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="returnDialog = false">Bekor qilish</VBtn>
          <VBtn
            color="warning"
            :disabled="!hasAnyReturnQty"
            :loading="returning"
            @click="confirmReturn"
          >
            Qaytarish
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <PrinterSettingsDialog v-model="printerDialog" />

    <!-- Bekor qilish -->
    <VDialog v-model="cancelDialog" max-width="420">
      <VCard title="Chekni bekor qilish">
        <VCardText>
          <p class="mb-3">
            #{{ cancelTarget?.id }} raqamli chekni bekor qilmoqchimisiz? Mahsulotlar omborga qaytariladi.
          </p>
          <AppTextField v-model="cancelReason" label="Sababi (ixtiyoriy)" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="cancelDialog = false">Yo'q</VBtn>
          <VBtn color="error" :loading="cancelling" @click="confirmCancel">Bekor qilish</VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script lang="ts" setup>
import { useOrdersStore } from '@/@core/stores/orders'
import { useToastStore } from '@/@core/stores/toast.store'
import { Order, OrderItem, OrderReturn } from '@/interface/order.interface'
import { useDebounceFn } from '@vueuse/core'
import { useRoute } from 'vue-router'
import PrinterSettingsDialog from '@/components/PrinterSettingsDialog.vue'
import ReceiptPreview from '@/components/ReceiptPreview.vue'
import { usePrinter } from '@/composables/usePrinter'
import { useCustomersStore } from '@/@core/stores/customers'
import { receiptFromOrder } from '@/utils/receipt'
import { decodeReceiptBarcode } from '@/utils/weightBarcode'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const ordersStore = useOrdersStore()
const toastStore = useToastStore()
const customersStore = useCustomersStore()
const route = useRoute()

const page = ref(1)
const filters = reactive({
  orderId: '' as string | number,
  productName: '',
  paymentType: null as string | null,
  status: null as string | null,
  date: '',
})

const paymentTypeOptions = [
  { title: 'Naqd', value: 'cash' },
  { title: 'Karta', value: 'card' },
  { title: "O'tkazma", value: 'transfer' },
  { title: 'Aralash', value: 'mixed' },
]

const statusOptions = [
  { title: 'Yakunlangan', value: 'completed' },
  { title: 'Bekor qilingan', value: 'cancelled' },
]

function hasActiveFilters() {
  return !!(filters.orderId || filters.productName || filters.paymentType || filters.status || filters.date)
}

async function refresh(p: number = 1) {
  page.value = p
  try {
    if (hasActiveFilters()) {
      await ordersStore.searchOrders({
        orderId: filters.orderId || undefined,
        productName: filters.productName || undefined,
        paymentType: filters.paymentType || undefined,
        status: filters.status || undefined,
        date: filters.date || undefined,
        page: p,
      })
    } else {
      await ordersStore.fetchOrders(p)
    }
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}
const debouncedSearch = useDebounceFn(() => refresh(1), 400)

// ─────────────────────────── Tafsilot ───────────────────────────
const detailDialog = ref(false)
const detailOrder = ref<Order | null>(null)
const orderReturns = ref<OrderReturn[]>([])
const detailCustomerName = ref<string | null>(null)

const detailReceipt = computed(() =>
  detailOrder.value
    ? receiptFromOrder(detailOrder.value, { customerName: detailCustomerName.value })
    : null,
)

async function openDetail(id: number) {
  try {
    detailOrder.value = await ordersStore.fetchOrder(id)
    orderReturns.value = await ordersStore.fetchOrderReturns(id)
    detailCustomerName.value = null
    if (detailOrder.value.customerId) {
      try {
        detailCustomerName.value = (await customersStore.fetchOne(detailOrder.value.customerId)).fullName
      } catch {
        // mijoz topilmasa ham chek ko'rsatiladi
      }
    }
    detailDialog.value = true
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

// ─────────────────────────── Haqiqiy printerga chop etish ───────────────────────────
const printerDialog = ref(false)
const printing = ref(false)
const { connected: printerConnected, printReceipt: sendToPrinter } = usePrinter()

async function printDetail() {
  if (!detailReceipt.value) return
  if (!printerConnected.value) {
    toastStore.error('Printer ulanmagan — sozlamalarni oching')
    printerDialog.value = true
    return
  }
  printing.value = true
  try {
    await sendToPrinter(detailReceipt.value)
  } catch (e: any) {
    toastStore.error(e?.message || "Chop etib bo'lmadi")
  } finally {
    printing.value = false
  }
}

// ─────────────────────────── Chek shtrix-kodi bo'yicha topish ───────────────────────────
const scanRef = ref()
const scanCode = ref('')

async function onScan() {
  const raw = (scanCode.value ?? '').trim()
  if (!raw) return
  let id = decodeReceiptBarcode(raw)
  if (!id && /^\d{1,9}$/.test(raw)) id = Number(raw) // oddiy chek raqami
  scanCode.value = ''
  if (!id) {
    toastStore.error('Bu chek shtrix-kodi emas')
    return
  }
  await openDetail(id)
}

watch(detailDialog, open => {
  if (!open) setTimeout(() => scanRef.value?.focus?.(), 150)
})

// ─────────────────────────── Qisman qaytarish ───────────────────────────
const returnDialog = ref(false)
const returnQty = reactive<Record<number, number>>({})
const returnReason = ref('')
const returning = ref(false)

function remainingQty(item: OrderItem): number {
  return Math.max(round2(item.quantity - (item.returnedQuantity || 0)), 0)
}

const hasReturnableItems = computed(() =>
  (detailOrder.value?.items ?? []).some(item => remainingQty(item) > 0),
)

function openReturn() {
  if (!detailOrder.value) return
  for (const item of detailOrder.value.items) {
    returnQty[item.id] = 0
  }
  returnReason.value = ''
  returnDialog.value = true
}

const hasAnyReturnQty = computed(() => Object.values(returnQty).some(v => Number(v) > 0))

// Qaytariladigan summani oldindan ko'rsatish uchun — chegirma hisobga
// olingan narx asosida taxminiy hisoblanadi (backend yakuniy summani
// o'zi aniq hisoblaydi)
const returnPreviewAmount = computed(() => {
  if (!detailOrder.value) return 0
  let total = 0
  for (const item of detailOrder.value.items) {
    const qty = Number(returnQty[item.id]) || 0
    if (qty <= 0) continue
    const unitNet = item.quantity > 0 ? (item.total / item.quantity) : 0
    total += unitNet * qty
  }
  return round2(total)
})

function round2(value: number) {
  return Math.round(value * 100) / 100
}

async function confirmReturn() {
  if (!detailOrder.value) return
  const items = Object.entries(returnQty)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([orderItemId, qty]) => ({ orderItemId: Number(orderItemId), quantity: Number(qty) }))

  if (!items.length) return

  returning.value = true
  try {
    const result = await ordersStore.createReturn(detailOrder.value.id, {
      items,
      reason: returnReason.value || undefined,
    })
    toastStore.success(
      `Qaytarildi: ${formatMoney(result.totalRefundAmount)} so'm` +
      (result.appliedToDebt > 0 ? ` (${formatMoney(result.appliedToDebt)} so'm qarzdan ayirildi)` : ''),
    )
    returnDialog.value = false
    // Chekni yangilab, qolgan miqdorlarni to'g'rilaymiz
    detailOrder.value = await ordersStore.fetchOrder(detailOrder.value.id)
    orderReturns.value = await ordersStore.fetchOrderReturns(detailOrder.value.id)
    refresh(page.value)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  } finally {
    returning.value = false
  }
}

// ─────────────────────────── Bekor qilish ───────────────────────────
const cancelDialog = ref(false)
const cancelTarget = ref<Order | null>(null)
const cancelReason = ref('')
const cancelling = ref(false)

function openCancel(order: Order) {
  cancelTarget.value = order
  cancelReason.value = ''
  cancelDialog.value = true
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    await ordersStore.cancelOrder(cancelTarget.value.id, cancelReason.value || undefined)
    toastStore.success('Chek bekor qilindi')
    cancelDialog.value = false
    refresh(page.value)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  } finally {
    cancelling.value = false
  }
}

function paymentLabel(type: string) {
  return paymentTypeOptions.find(p => p.value === type)?.title ?? type
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}

function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => {
  refresh(1)
  const fromQuery = Number(route.query.order)
  if (fromQuery) openDetail(fromQuery)
  else setTimeout(() => scanRef.value?.focus?.(), 200)
})

watch(
  () => route.query.order,
  val => {
    if (val) openDetail(Number(val))
  },
)
</script>

<style lang="scss" scoped>
.receipt-scan {
  max-inline-size: 460px;
}
</style>
