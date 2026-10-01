<template>
  <div>
    <VCard title="Cheklar" class="mb-6">
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
    <VDialog v-model="detailDialog" max-width="420">
      <VCard v-if="detailOrder">
        <VCardText>
          <div id="pos-receipt" class="pos-receipt">
            <div class="pos-receipt__header">
              <div class="pos-receipt__shop">CHEK</div>
              <div class="pos-receipt__meta">
                <span>#{{ detailOrder.id }}</span>
                <span>{{ formatDate(detailOrder.createdAt) }}</span>
              </div>
            </div>
            <div class="pos-receipt__divider">— — — — — — — — — — — — — — —</div>
            <div v-for="item in detailOrder.items" :key="item.id" class="pos-receipt__line">
              <div>{{ item.product.name }}</div>
              <div class="pos-receipt__line-sub">
                <span>{{ formatQty(item.quantity) }} × {{ formatMoney(item.selling_price) }}</span>
                <span>{{ formatMoney(item.total) }}</span>
              </div>
            </div>
            <div class="pos-receipt__divider">— — — — — — — — — — — — — — —</div>
            <div class="pos-receipt__row"><span>Jami</span><span>{{ formatMoney(detailOrder.total) }} so'm</span></div>
            <div class="pos-receipt__row"><span>To'landi</span><span>{{ formatMoney(detailOrder.paidAmount) }} so'm</span></div>
            <div v-if="detailOrder.debtAmount > 0" class="pos-receipt__row pos-receipt__row--debt">
              <span>Qarz</span><span>{{ formatMoney(detailOrder.debtAmount) }} so'm</span>
            </div>
            <div class="pos-receipt__row"><span>To'lov turi</span><span>{{ paymentLabel(detailOrder.paymentType) }}</span></div>
            <div v-if="detailOrder.user" class="pos-receipt__row"><span>Kassir</span><span>{{ detailOrder.user.name }}</span></div>
            <div class="pos-receipt__divider">— — — — — — — — — — — — — — —</div>
            <div v-if="detailOrder.status === 'cancelled'" class="text-center text-error font-weight-bold my-1">
              BEKOR QILINGAN
            </div>
            <div class="pos-receipt__footer">Xaridingiz uchun rahmat!</div>
          </div>

          <!-- Avval qilingan qaytarishlar -->
          <div v-if="orderReturns.length" class="pos-no-print mt-4">
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
        <VCardText class="d-flex justify-end gap-2 pt-0 pos-no-print">
          <VBtn
            v-if="detailOrder.status === 'completed' && hasReturnableItems"
            variant="tonal"
            color="warning"
            prepend-icon="tabler-rotate"
            @click="openReturn"
          >
            Qaytarish
          </VBtn>
          <VBtn variant="tonal" prepend-icon="tabler-printer" @click="printReceipt">
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

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const ordersStore = useOrdersStore()
const toastStore = useToastStore()

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

async function openDetail(id: number) {
  try {
    detailOrder.value = await ordersStore.fetchOrder(id)
    orderReturns.value = await ordersStore.fetchOrderReturns(id)
    detailDialog.value = true
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

function printReceipt() {
  nextTick(() => window.print())
}

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

onMounted(() => refresh(1))
</script>

<style lang="scss" scoped>
.pos-receipt {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;

  &__header {
    text-align: center;
    margin-block-end: 8px;
  }

  &__shop {
    font-weight: 700;
    font-size: 0.95rem;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  &__divider {
    text-align: center;
    opacity: 0.5;
    margin-block: 4px;
  }

  &__line {
    margin-block-end: 4px;
  }

  &__line-sub {
    display: flex;
    justify-content: space-between;
    opacity: 0.8;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
  }

  &__row--debt {
    color: rgb(var(--v-theme-error));
  }

  &__footer {
    text-align: center;
    margin-block-start: 8px;
    opacity: 0.7;
  }
}
</style>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #pos-receipt, #pos-receipt * {
    visibility: visible;
  }
  #pos-receipt {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    inline-size: 100%;
  }
  .pos-no-print {
    display: none !important;
  }
}
</style>
