<template>
  <div class="pos-page">
    <!-- ═══════════════ TOP BAR ═══════════════ -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
      <div class="d-flex align-center gap-3">
        <VChip :color="isOnline ? 'success' : 'error'" size="small" variant="flat">
          <VIcon start :icon="isOnline ? 'tabler-wifi' : 'tabler-wifi-off'" size="14" />
          {{ isOnline ? 'Onlayn' : 'Oflayn' }}
        </VChip>

        <VChip
          v-if="offlineStore.pendingOrders.length"
          :color="offlineStore.failedCount ? 'error' : 'warning'"
          size="small"
          variant="tonal"
          class="cursor-pointer"
          @click="pendingDialog = true"
        >
          <VIcon start icon="tabler-clock-exclamation" size="14" />
          {{ offlineStore.pendingCount }} kutilmoqda
          <span v-if="offlineStore.failedCount">, {{ offlineStore.failedCount }} xato</span>
        </VChip>

        <span v-if="cashierName" class="text-medium-emphasis text-body-2">
          Kassir: <strong>{{ cashierName }}</strong>
        </span>
      </div>

      <div class="d-flex align-center gap-2 text-caption text-medium-emphasis">
        <VChip size="small" variant="tonal"><kbd>F2</kbd>&nbsp;Qidirish</VChip>
        <VChip size="small" variant="tonal"><kbd>F4</kbd>&nbsp;To'lash</VChip>
        <VChip size="small" variant="tonal"><kbd>Esc</kbd>&nbsp;Bekor qilish</VChip>
      </div>
    </div>

    <VRow>
      <!-- ═══════════════ 1) MAHSULOTLAR RO'YXATI (kichikroq) ═══════════════ -->
      <VCol cols="12" md="4">
        <VCard title="Mahsulotlar" class="h-100 d-flex flex-column">
          <VCardText class="pb-2">
            <VTextField
              ref="topSearchRef"
              v-model="listSearch"
              placeholder="Nomi, barcode yoki kod..."
              prepend-inner-icon="tabler-search"
              density="compact"
              clearable
              class="mb-2"
              @update:model-value="debouncedListSearch"
            />

            <VRow dense>
              <VCol cols="6">
                <AppSelect
                  v-model="stockFilter"
                  :items="productsStore.stockFilters"
                  item-title="name"
                  item-value="value"
                  placeholder="Qoldiq"
                  clearable
                  density="compact"
                  @update:model-value="loadList(1)"
                />
              </VCol>
              <VCol cols="6">
                <AppSelect
                  v-model="statusFilter"
                  :items="statusOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Holati"
                  clearable
                  density="compact"
                  @update:model-value="loadList(1)"
                />
              </VCol>
            </VRow>
          </VCardText>

          <VTable density="compact" fixed-header height="380" class="pos-table-compact">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Nomi</th>
                <th class="text-end">Narxi</th>
                <th class="text-end">Qoldiq</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in productsStore.products"
                :key="p.id"
                class="pos-row"
                :class="{ 'pos-row--disabled': p.quantity <= 0 }"
                @click="addToCart(p)"
              >
                <td class="text-caption">{{ p.barcode || p.quick_code || '-' }}</td>
                <td class="text-caption">{{ p.name }}</td>
                <td class="text-end text-caption">{{ formatMoney(p.selling_price) }}</td>
                <td class="text-end">
                  <VChip :color="stockColor(p)" size="x-small" variant="tonal">
                    {{ p.quantity }}
                  </VChip>
                </td>
              </tr>
              <tr v-if="!productsStore.products.length">
                <td colspan="4" class="text-center text-caption text-medium-emphasis py-6">
                  Mahsulot topilmadi
                </td>
              </tr>
            </tbody>
          </VTable>

          <VCardText class="d-flex justify-space-between align-center py-2">
            <span class="text-caption text-medium-emphasis">
              {{ productsStore.total }} ta
            </span>
            <VPagination
              v-if="isOnline"
              v-model="listPage"
              :length="Math.max(Math.ceil(productsStore.total / productsStore.limit), 1)"
              :total-visible="3"
              density="compact"
              size="small"
              @update:model-value="loadList"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- ═══════════════ 2) SAVAT (CHEK) — kattaroq ═══════════════ -->
      <VCol cols="12" md="8">
        <VCard title="Savat" class="h-100">
          <template #append>
            <div class="d-flex gap-2">
              <VChip v-if="cart.length" color="primary" variant="tonal">
                {{ cart.length }} mahsulot
              </VChip>
              <VBtn
                v-if="cart.length"
                size="small"
                variant="text"
                color="error"
                @click="clearCart()"
              >
                Tozalash
              </VBtn>
            </div>
          </template>

          <VCardText>
            <p v-if="!cart.length" class="text-medium-emphasis text-center py-10">
              Savat bo'sh — chapdan mahsulot tanlang yoki barcode skanerlang
            </p>

            <VTable v-else density="comfortable">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th style="width: 130px">Miqdor</th>
                  <th style="width: 100px">Chegirma, %</th>
                  <th class="text-end">Jami</th>
                  <th style="width: 40px" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in cart" :key="line.productId">
                  <td>
                    <div class="text-body-2 font-weight-medium">{{ line.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatMoney(line.price) }} so'm / dona
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-center gap-1">
                      <VBtn icon size="x-small" variant="tonal" @click="stepQty(line, -1)">
                        <VIcon icon="tabler-minus" size="14" />
                      </VBtn>
                      <VTextField
                        v-model.number="line.quantity"
                        type="number"
                        density="compact"
                        hide-details
                        style="width: 60px"
                        @update:model-value="clampQty(line)"
                      />
                      <VBtn icon size="x-small" variant="tonal" @click="stepQty(line, 1)">
                        <VIcon icon="tabler-plus" size="14" />
                      </VBtn>
                    </div>
                  </td>
                  <td>
                    <VTextField
                      v-model.number="line.discountPercent"
                      type="number"
                      density="compact"
                      hide-details
                      min="0"
                      max="100"
                      suffix="%"
                    />
                  </td>
                  <td class="text-end font-weight-medium">
                    {{ formatMoney(lineTotal(line)) }}
                  </td>
                  <td>
                    <IconBtn size="small" @click="removeFromCart(line.productId)">
                      <VIcon icon="tabler-trash" color="error" />
                    </IconBtn>
                  </td>
                </tr>
              </tbody>
            </VTable>

            <VTextField
              ref="scanInputRef"
              v-model="scanQuery"
              placeholder="Mahsulot qo'shish uchun barcode kiriting..."
              prepend-inner-icon="tabler-barcode"
              density="comfortable"
              class="mt-3"
              @keydown.enter="onScanEnter"
            />

            <VDivider class="my-4" />

            <VRow class="mb-2">
              <VCol cols="12" sm="5">
                <AppTextField
                  v-model.number="overallDiscountValue"
                  type="number"
                  label="Umumiy chegirma (barcha mahsulotlarga)"
                />
              </VCol>
              <VCol cols="12" sm="3">
                <AppSelect
                  v-model="overallDiscountType"
                  :items="overallDiscountTypeOptions"
                  item-title="title"
                  item-value="value"
                />
              </VCol>
              <VCol cols="12" sm="4">
                <AppTextField v-model="note" label="Izoh (ixtiyoriy)" />
              </VCol>
            </VRow>

            <VDivider class="mb-3" />

            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span class="text-medium-emphasis">Mahsulotlar jami:</span>
              <span>{{ formatMoney(subtotal) }} so'm</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-1 text-error">
              <span>Mahsulot chegirmasi:</span>
              <span>- {{ formatMoney(lineDiscountsTotal) }} so'm</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-2 text-error">
              <span>Umumiy chegirma:</span>
              <span>- {{ formatMoney(overallDiscountAmount) }} so'm</span>
            </div>
            <div class="d-flex justify-space-between text-h6 mb-4">
              <span>To'lanadi:</span>
              <span>{{ formatMoney(grandTotal) }} so'm</span>
            </div>

            <div class="d-flex gap-2">
              <VBtn
                size="large"
                color="primary"
                class="flex-grow-1"
                :disabled="!cart.length"
                @click="openPaymentDialog"
              >
                To'lash (F4)
              </VBtn>
              <VBtn
                size="large"
                variant="tonal"
                prepend-icon="tabler-device-floppy"
                :disabled="!cart.length"
                @click="holdSale"
              >
                Saqlash
                <VChip v-if="heldSales.length" size="x-small" class="ml-2">{{ heldSales.length }}</VChip>
              </VBtn>
              <VBtn
                size="large"
                variant="tonal"
                color="error"
                :disabled="!cart.length"
                @click="clearCart()"
              >
                Bekor (Esc)
              </VBtn>
            </div>

            <VExpansionPanels v-if="heldSales.length" class="mt-4" variant="accordion">
              <VExpansionPanel title="Saqlangan savatlar">
                <template #text>
                  <div
                    v-for="held in heldSales"
                    :key="held.id"
                    class="d-flex justify-space-between align-center py-1"
                  >
                    <span class="text-caption">
                      {{ held.cart.length }} mahsulot — {{ formatMoney(held.total) }} so'm
                    </span>
                    <div class="d-flex gap-1">
                      <VBtn size="x-small" variant="text" color="primary" @click="resumeHeld(held.id)">
                        Tiklash
                      </VBtn>
                      <VBtn size="x-small" variant="text" color="error" @click="discardHeld(held.id)">
                        O'chirish
                      </VBtn>
                    </div>
                  </div>
                </template>
              </VExpansionPanel>
            </VExpansionPanels>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ═══════════════ SO'NGGI CHEKLAR ═══════════════ -->
    <VCard title="So'nggi cheklar" class="mt-6">
      <VTable density="comfortable">
        <thead>
          <tr>
            <th>№</th>
            <th>Vaqt</th>
            <th>To'lov turi</th>
            <th class="text-end">Summa</th>
            <th>Holati</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in recentOrders" :key="o.id">
            <td>#{{ o.id }}</td>
            <td>{{ formatDate(o.createdAt) }}</td>
            <td>{{ paymentLabel(o.paymentType) }}</td>
            <td class="text-end">{{ formatMoney(o.total) }} so'm</td>
            <td>
              <VChip :color="o.status === 'completed' ? 'success' : 'error'" size="small">
                {{ o.status === 'completed' ? 'Yakunlangan' : 'Bekor qilingan' }}
              </VChip>
            </td>
          </tr>
          <tr v-if="!recentOrders.length">
            <td colspan="5" class="text-center text-medium-emphasis py-4">Cheklar yo'q</td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- ═══════════════ TO'LOV MODALI ═══════════════ -->
    <VDialog v-model="paymentDialog" max-width="560" persistent>
      <VCard title="To'lov">
        <template #append>
          <VBtn icon variant="text" @click="paymentDialog = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </template>

        <VCardText>
          <div class="d-flex justify-space-between mb-4">
            <span class="text-medium-emphasis">To'lanadigan summa:</span>
            <span class="text-h5 font-weight-bold">{{ formatMoney(grandTotal) }} so'm</span>
          </div>

          <VRow dense class="mb-4">
            <VCol v-for="opt in paymentOptions" :key="opt.value" cols="6" sm="3">
              <VCard
                :variant="paymentType === opt.value ? 'flat' : 'tonal'"
                :color="paymentType === opt.value ? 'primary' : undefined"
                class="pos-pay-card text-center pa-3"
                @click="selectPaymentType(opt.value)"
              >
                <VIcon :icon="opt.icon" size="22" class="mb-1" />
                <div class="text-caption">{{ opt.title }}</div>
              </VCard>
            </VCol>
          </VRow>

          <VRow dense class="mb-2">
            <template v-if="paymentType !== 'mixed'">
              <VCol cols="12">
                <VTextField
                  v-model.number="paidAmount"
                  type="number"
                  label="Berilgan summa"
                  variant="outlined"
                  density="comfortable"
                  @focus="setActiveField('paidAmount')"
                  @update:model-value="onManualEdit('paidAmount')"
                />
              </VCol>
            </template>
            <template v-else>
              <VCol cols="6">
                <VTextField
                  v-model.number="mixedCash"
                  type="number"
                  label="Naqd"
                  variant="outlined"
                  density="comfortable"
                  @focus="setActiveField('mixedCash')"
                  @update:model-value="onManualEdit('mixedCash')"
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model.number="mixedCard"
                  type="number"
                  label="Karta"
                  variant="outlined"
                  density="comfortable"
                  @focus="setActiveField('mixedCard')"
                  @update:model-value="onManualEdit('mixedCard')"
                />
              </VCol>
            </template>
          </VRow>

          <!-- Raqamli panel -->
          <div class="pos-keypad mb-4">
            <VBtn
              v-for="key in ['7','8','9','4','5','6','1','2','3','0','00','⌫']"
              :key="key"
              variant="tonal"
              class="pos-keypad__btn"
              @click="pressKey(key)"
            >
              {{ key }}
            </VBtn>
            <VBtn variant="tonal" color="error" class="pos-keypad__btn pos-keypad__btn--clear" @click="pressClear">
              C
            </VBtn>
          </div>

          <div class="d-flex justify-space-between mb-1 text-body-2">
            <span class="text-medium-emphasis">To'landi:</span>
            <span>{{ formatMoney(effectivePaid) }} so'm</span>
          </div>
          <div v-if="changeAmount > 0" class="d-flex justify-space-between mb-1 text-success">
            <span>Qaytim:</span>
            <span class="font-weight-medium">{{ formatMoney(changeAmount) }} so'm</span>
          </div>
          <div v-if="debtAmount > 0" class="mb-3">
            <div class="d-flex justify-space-between text-error mb-2">
              <span>Qarz qoladi:</span>
              <span class="font-weight-medium">{{ formatMoney(debtAmount) }} so'm</span>
            </div>

            <VAutocomplete
              v-model="customerId"
              v-model:search="customerSearch"
              :items="customersStore.customers"
              item-title="fullName"
              item-value="id"
              label="Mijoz (qarz uchun majburiy)"
              variant="outlined"
              density="comfortable"
              :loading="customerLoading"
              :disabled="!isOnline"
              clearable
              no-filter
              @update:search="onCustomerSearch"
            >
              <template #append>
                <VBtn icon size="small" variant="text" :disabled="!isOnline" @click="newCustomerDialog = true">
                  <VIcon icon="tabler-user-plus" />
                </VBtn>
              </template>
            </VAutocomplete>
            <p v-if="!isOnline" class="text-caption text-warning mt-1">
              Oflayn holatda faqat avval keshlangan mijozlardan tanlash mumkin
            </p>
          </div>

          <VBtn
            block
            size="large"
            color="primary"
            :disabled="checkingOut"
            :loading="checkingOut"
            @click="checkout"
          >
            Tasdiqlash
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Tezkor mijoz qo'shish -->
    <VDialog v-model="newCustomerDialog" max-width="420">
      <VCard title="Yangi mijoz">
        <VCardText>
          <AppTextField v-model="newCustomer.fullName" label="Ism familiya" class="mb-3" />
          <AppTextField v-model="newCustomer.phone" label="Telefon" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="newCustomerDialog = false">Bekor qilish</VBtn>
          <VBtn color="primary" :disabled="!newCustomer.fullName" @click="createCustomer">
            Saqlash
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Kutilayotgan (oflayn) cheklar -->
    <VDialog v-model="pendingDialog" max-width="480">
      <VCard title="Kutilayotgan cheklar">
        <VCardText>
          <p v-if="!offlineStore.pendingOrders.length" class="text-medium-emphasis">
            Kutilayotgan chek yo'q
          </p>
          <div
            v-for="o in offlineStore.pendingOrders"
            :key="o.localId"
            class="d-flex justify-space-between align-center py-2 border-b"
          >
            <div>
              <div class="text-body-2">{{ formatMoney(orderPayloadTotal(o.payload)) }} so'm</div>
              <div class="text-caption text-medium-emphasis">
                {{ formatDate(o.createdAt) }}
                <VChip :color="o.status === 'failed' ? 'error' : 'warning'" size="x-small" class="ml-1">
                  {{ o.status === 'failed' ? 'Xato' : 'Kutilmoqda' }}
                </VChip>
              </div>
              <div v-if="o.errorMessage" class="text-caption text-error">{{ o.errorMessage }}</div>
            </div>
            <div class="d-flex gap-1">
              <VBtn
                v-if="o.status === 'failed'"
                size="x-small"
                variant="tonal"
                color="primary"
                :disabled="!isOnline"
                @click="offlineStore.retryOne(o.localId)"
              >
                Qayta urinish
              </VBtn>
              <VBtn size="x-small" variant="text" color="error" @click="offlineStore.discardOne(o.localId)">
                O'chirish
              </VBtn>
            </div>
          </div>
        </VCardText>
        <VCardText class="d-flex justify-end">
          <VBtn
            variant="tonal"
            :disabled="!isOnline || offlineStore.syncing"
            :loading="offlineStore.syncing"
            @click="offlineStore.syncPending()"
          >
            Hammasini sinxronlash
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Muvaffaqiyatli chek -->
    <VDialog v-model="receiptDialog" max-width="380">
      <VCard :title="lastOrder?.offline ? 'Chek saqlandi (oflayn) 🕓' : 'Chek yakunlandi ✅'">
        <VCardText v-if="lastOrder">
          <div v-if="lastOrder.offline" class="text-caption text-warning mb-2">
            Internet yo'q edi — chek mahalliy saqlandi, internet qaytganda avtomatik yuboriladi.
          </div>
          <div class="d-flex justify-space-between mb-1">
            <span>Jami:</span>
            <span>{{ formatMoney(lastOrder.total) }} so'm</span>
          </div>
          <div class="d-flex justify-space-between mb-1">
            <span>To'landi:</span>
            <span>{{ formatMoney(lastOrder.paidAmount) }} so'm</span>
          </div>
          <div v-if="lastOrder.debtAmount > 0" class="d-flex justify-space-between text-error">
            <span>Qarz:</span>
            <span>{{ formatMoney(lastOrder.debtAmount) }} so'm</span>
          </div>
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" prepend-icon="tabler-printer" @click="printReceipt">
            Chek chiqarish
          </VBtn>
          <VBtn color="primary" @click="receiptDialog = false">Yopish</VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script lang="ts" setup>
import { useCustomersStore } from '@/@core/stores/customers'
import { useOfflineStore } from '@/@core/stores/offline'
import { useOrdersStore } from '@/@core/stores/orders'
import { useProductsStore } from '@/@core/stores/products'
import { useToastStore } from '@/@core/stores/toast.store'
import { $api } from '@/utils/api'
import { Order } from '@/interface/order.interface'
import { Product } from '@/interface/products.interface'
import { useDebounceFn, useOnline } from '@vueuse/core'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

interface CartLine {
  productId: number
  name: string
  price: number
  quantity: number
  discountPercent: number
  availableQuantity: number
}

interface HeldSale {
  id: number
  cart: CartLine[]
  total: number
  savedAt: Date
}

const productsStore = useProductsStore()
const ordersStore = useOrdersStore()
const customersStore = useCustomersStore()
const offlineStore = useOfflineStore()
const toastStore = useToastStore()

const isOnline = useOnline()

// ─────────────────────────── Kassir nomi (token'dan) ───────────────────────────
const cashierName = ref('')
function decodeJwtPayload(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(base64))))
  } catch {
    return null
  }
}
onMounted(() => {
  const token = useCookie('accessToken').value
  if (token) {
    const payload = decodeJwtPayload(token)
    cashierName.value = payload?.username || ''
  }
})

// ─────────────────────────── Oflayn kesh ───────────────────────────
async function refreshOfflineCache() {
  if (!isOnline.value) return
  try {
    const [productsRes, customersRes] = await Promise.all([
      $api('/products?page=1&limit=1000') as Promise<any>,
      $api('/customers?page=1&limit=1000') as Promise<any>,
    ])
    await offlineStore.cacheProducts(productsRes?.data?.data ?? [])
    await offlineStore.cacheCustomers(customersRes?.data?.data ?? [])
  } catch {
    // jim turadi — kesh yangilanmasa ham asosiy oqim davom etadi
  }
}

// ─────────────────────────── Doimiy mahsulotlar ro'yxati ───────────────────────────
const topSearchRef = ref()
const listSearch = ref('')
const stockFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)
const listPage = ref(1)

const statusOptions = [
  { title: 'Aktiv', value: 'true' },
  { title: 'Noaktiv', value: 'false' },
]

const overallDiscountTypeOptions = [
  { title: '%', value: 'percent' },
  { title: "so'm", value: 'amount' },
]

function stockColor(p: Product) {
  if (p.quantity <= 0) return 'error'
  if (p.stock === 'LOW_STOCK') return 'warning'
  return 'success'
}

async function loadList(page: number = 1) {
  listPage.value = page

  if (!isOnline.value) {
    const cached = await offlineStore.getCachedProducts()
    const filtered = cached.filter(p => {
      if (listSearch.value?.trim()) {
        const q = listSearch.value.trim().toLowerCase()
        const hit =
          p.name?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.quick_code?.toLowerCase().includes(q)
        if (!hit) return false
      }
      if (stockFilter.value && p.stock !== stockFilter.value) return false
      if (statusFilter.value !== null && statusFilter.value !== undefined && statusFilter.value !== '') {
        if (String(p.status) !== statusFilter.value) return false
      }
      return true
    })
    productsStore.products = filtered
    productsStore.total = filtered.length
    productsStore.limit = filtered.length || 1
    return
  }

  productsStore
    .fetchProducts(page, {
      limit: 10,
      name: listSearch.value || undefined,
      stock: stockFilter.value || undefined,
      status: statusFilter.value ?? undefined,
    })
    .catch((error: any) => {
      toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
    })
}
const debouncedListSearch = useDebounceFn(() => loadList(1), 350)

// ─────────────────────────── Savat ───────────────────────────
const cart = ref<CartLine[]>([])
const scanInputRef = ref()
const scanQuery = ref('')

function focusScan() {
  nextTick(() => scanInputRef.value?.focus?.())
}

function addToCart(product: Product) {
  const availableQty = product.quantity ?? 0
  if (availableQty <= 0) {
    toastStore.error('Bu mahsulot omborda qolmagan')
    return
  }

  const existing = cart.value.find(l => l.productId === product.id)
  if (existing) {
    if (existing.quantity + 1 > existing.availableQuantity) {
      toastStore.error("Omborda shuncha mahsulot yo'q")
      return
    }
    existing.quantity += 1
  } else {
    cart.value.push({
      productId: product.id,
      name: product.name,
      price: product.selling_price ?? 0,
      quantity: 1,
      discountPercent: 0,
      availableQuantity: availableQty,
    })
  }
}

async function onScanEnter() {
  const value = scanQuery.value?.trim()
  if (!value) return

  if (!isOnline.value) {
    const cached = await offlineStore.getCachedProducts()
    const match = cached.find(p => p.barcode === value || p.quick_code === value)
    if (match) {
      addToCart(match)
      scanQuery.value = ''
      focusScan()
    } else {
      toastStore.error('Mahsulot topilmadi (oflayn kesh)')
    }
    return
  }

  try {
    const byBarcode: any = await productsStore.searchProduct({ barcode: value })
    if (byBarcode?.data?.length === 1) {
      addToCart(byBarcode.data[0])
      scanQuery.value = ''
      focusScan()
      return
    }
    const byQuick: any = await productsStore.searchProduct({ quickCode: value })
    if (byQuick?.data?.length === 1) {
      addToCart(byQuick.data[0])
      scanQuery.value = ''
      focusScan()
      return
    }
    toastStore.error('Mahsulot topilmadi')
  } catch {
    toastStore.error('Mahsulot topilmadi')
  }
}

function removeFromCart(productId: number) {
  cart.value = cart.value.filter(l => l.productId !== productId)
}

function clampQty(line: CartLine) {
  if (!line.quantity || line.quantity < 1) line.quantity = 1
  if (line.quantity > line.availableQuantity) {
    line.quantity = line.availableQuantity
    toastStore.error("Omborda shuncha mahsulot yo'q")
  }
}

function stepQty(line: CartLine, delta: number) {
  line.quantity = (Number(line.quantity) || 0) + delta
  clampQty(line)
}

function lineDiscountAmount(line: CartLine) {
  return round2((line.price * line.quantity * (line.discountPercent || 0)) / 100)
}

function lineTotal(line: CartLine) {
  return line.price * line.quantity - lineDiscountAmount(line)
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function clearCart() {
  cart.value = []
  overallDiscountValue.value = 0
  note.value = ''
  paymentType.value = 'cash'
  customerId.value = null
  paidAmountTouched.value = false
  mixedTouched.value = false
  focusScan()
}

const subtotal = computed(() => cart.value.reduce((sum, l) => sum + l.price * l.quantity, 0))
const lineDiscountsTotal = computed(() =>
  round2(cart.value.reduce((sum, l) => sum + lineDiscountAmount(l), 0)),
)

// ─────────────────────────── Umumiy chegirma ───────────────────────────
const overallDiscountValue = ref(0)
const overallDiscountType = ref<'percent' | 'amount'>('percent')
const note = ref('')

const overallDiscountAmount = computed(() => {
  const base = Math.max(subtotal.value - lineDiscountsTotal.value, 0)
  if (overallDiscountType.value === 'percent') {
    return round2((base * (overallDiscountValue.value || 0)) / 100)
  }
  return Math.min(overallDiscountValue.value || 0, base)
})

const grandTotal = computed(() =>
  Math.max(subtotal.value - lineDiscountsTotal.value - overallDiscountAmount.value, 0),
)

// ─────────────────────────── To'lov (modal) ───────────────────────────
const paymentDialog = ref(false)
const paymentOptions = [
  { title: 'Naqd', value: 'cash', icon: 'tabler-cash' },
  { title: 'Karta', value: 'card', icon: 'tabler-credit-card' },
  { title: "O'tkazma", value: 'transfer', icon: 'tabler-building-bank' },
  { title: 'Aralash', value: 'mixed', icon: 'tabler-arrows-exchange' },
]

const paymentType = ref('cash')
const paidAmount = ref(0)
const mixedCash = ref(0)
const mixedCard = ref(0)

// "touched" flag'lar: foydalanuvchi summani qo'lda o'zgartirganini bildiradi.
// Shu orqali savat o'zgarganda (masalan chegirma qo'shilganda) foydalanuvchi
// ataylab kiritgan QISMAN to'lov (qarz uchun) qayta ustidan yozib
// yuborilmaydi — avvalgi versiyadagi asosiy bug shu edi.
const paidAmountTouched = ref(false)
const mixedTouched = ref(false)

watch(grandTotal, val => {
  if (paymentType.value !== 'mixed') {
    if (!paidAmountTouched.value) paidAmount.value = val
  } else if (!mixedTouched.value) {
    mixedCash.value = val
    mixedCard.value = 0
  }
})

function selectPaymentType(type: string) {
  paymentType.value = type
  paidAmountTouched.value = false
  mixedTouched.value = false
  if (type === 'mixed') {
    mixedCash.value = grandTotal.value
    mixedCard.value = 0
  } else {
    paidAmount.value = grandTotal.value
  }
}

function onManualEdit(field: 'paidAmount' | 'mixedCash' | 'mixedCard') {
  if (field === 'paidAmount') paidAmountTouched.value = true
  else mixedTouched.value = true
}

function openPaymentDialog() {
  if (!cart.value.length) return
  if (!paidAmountTouched.value) paidAmount.value = grandTotal.value
  if (!mixedTouched.value) {
    mixedCash.value = grandTotal.value
    mixedCard.value = 0
  }
  paymentDialog.value = true
}

// ─────────────────────────── Raqamli panel ───────────────────────────
const activeAmountField = ref<'paidAmount' | 'mixedCash' | 'mixedCard'>('paidAmount')
const keypadFresh = ref(true)

function setActiveField(field: 'paidAmount' | 'mixedCash' | 'mixedCard') {
  activeAmountField.value = field
  keypadFresh.value = true
}

function getActiveValue(): number {
  if (activeAmountField.value === 'paidAmount') return paidAmount.value
  if (activeAmountField.value === 'mixedCash') return mixedCash.value
  return mixedCard.value
}

function setActiveValue(v: number) {
  if (activeAmountField.value === 'paidAmount') {
    paidAmount.value = v
    paidAmountTouched.value = true
  } else if (activeAmountField.value === 'mixedCash') {
    mixedCash.value = v
    mixedTouched.value = true
  } else {
    mixedCard.value = v
    mixedTouched.value = true
  }
}

function pressKey(key: string) {
  if (key === '⌫') {
    const current = String(getActiveValue())
    const next = current.slice(0, -1)
    setActiveValue(next ? Number(next) : 0)
    keypadFresh.value = false
    return
  }
  const current = keypadFresh.value ? '' : String(getActiveValue() || '')
  const next = current + key
  setActiveValue(Number(next) || 0)
  keypadFresh.value = false
}

function pressClear() {
  setActiveValue(0)
  keypadFresh.value = false
}

const effectivePaid = computed(() =>
  paymentType.value === 'mixed'
    ? (Number(mixedCash.value) || 0) + (Number(mixedCard.value) || 0)
    : Number(paidAmount.value) || 0,
)

const changeAmount = computed(() => Math.max(effectivePaid.value - grandTotal.value, 0))
const debtAmount = computed(() => Math.max(grandTotal.value - effectivePaid.value, 0))

// ─────────────────────────── Mijoz ───────────────────────────
const customerId = ref<number | null>(null)
const customerSearch = ref('')
const customerLoading = ref(false)

const onCustomerSearch = useDebounceFn(async (value: string) => {
  if (!value || !isOnline.value) return
  customerLoading.value = true
  try {
    await customersStore.fetchCustomers(1, value)
  } finally {
    customerLoading.value = false
  }
}, 350)

const newCustomerDialog = ref(false)
const newCustomer = reactive({ fullName: '', phone: '' })

async function createCustomer() {
  try {
    const created = await customersStore.createCustomer({
      fullName: newCustomer.fullName,
      phone: newCustomer.phone || undefined,
    })
    customersStore.customers.unshift(created)
    customerId.value = created.id
    newCustomerDialog.value = false
    newCustomer.fullName = ''
    newCustomer.phone = ''
    toastStore.success("Mijoz qo'shildi")
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

// ─────────────────────────── Vaqtincha saqlash (hold sale) ───────────────────────────
const heldSales = ref<HeldSale[]>([])

function holdSale() {
  if (!cart.value.length) return
  heldSales.value.push({
    id: Date.now(),
    cart: JSON.parse(JSON.stringify(cart.value)),
    total: grandTotal.value,
    savedAt: new Date(),
  })
  clearCart()
  toastStore.success('Savat vaqtincha saqlandi')
}

function resumeHeld(id: number) {
  const held = heldSales.value.find(h => h.id === id)
  if (!held) return
  cart.value = held.cart
  heldSales.value = heldSales.value.filter(h => h.id !== id)
}

function discardHeld(id: number) {
  heldSales.value = heldSales.value.filter(h => h.id !== id)
}

// ─────────────────────────── So'nggi cheklar ───────────────────────────
const recentOrders = ref<Order[]>([])
async function loadRecent() {
  if (!isOnline.value) return
  try {
    await ordersStore.fetchOrders(1)
    recentOrders.value = ordersStore.orders.slice(0, 5)
  } catch {
    // jim turadi
  }
}

function paymentLabel(type: string) {
  return paymentOptions.find(p => p.value === type)?.title ?? type
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function orderPayloadTotal(payload: any) {
  return payload?.paidAmount ?? 0
}

// ─────────────────────────── Checkout ───────────────────────────
const checkingOut = ref(false)
const receiptDialog = ref(false)
const pendingDialog = ref(false)
const lastOrder = ref<(Order & { offline?: boolean }) | null>(null)

async function checkout() {
  if (!cart.value.length) return

  if (debtAmount.value > 0 && !customerId.value) {
    toastStore.error('Qarz uchun mijoz tanlanishi shart')
    return
  }

  if (paymentType.value === 'mixed') {
    const sum = (Number(mixedCash.value) || 0) + (Number(mixedCard.value) || 0)
    if (sum > grandTotal.value + 0.05 && Number(mixedCard.value) > 0) {
      // karta orqali "qaytim" bo'lmaydi, faqat naqdda bo'ladi — ogohlantiramiz
      toastStore.error("Karta orqali ortiqcha to'lov kiritilmasin, faqat naqd uchun qaytim hisoblanadi")
      return
    }
  }

  checkingOut.value = true
  try {
    const linesWithBase = cart.value.map(l => ({
      line: l,
      base: l.price * l.quantity - lineDiscountAmount(l),
    }))
    const baseSum = linesWithBase.reduce((s, x) => s + x.base, 0) || 1

    const payload: any = {
      items: linesWithBase.map(({ line, base }) => {
        const proportionalShare = round2((overallDiscountAmount.value * base) / baseSum)
        return {
          product_id: line.productId,
          quantity: line.quantity,
          discount: round2(lineDiscountAmount(line) + proportionalShare) || undefined,
        }
      }),
      paymentType: paymentType.value,
      paidAmount: effectivePaid.value,
    }

    if (paymentType.value === 'mixed') {
      payload.payments = [
        { type: 'cash', amount: Number(mixedCash.value) || 0 },
        { type: 'card', amount: Number(mixedCard.value) || 0 },
      ].filter(p => p.amount > 0)
    }

    if (customerId.value) payload.customerId = customerId.value

    if (!isOnline.value) {
      await offlineStore.queueOrder(payload)
      lastOrder.value = {
        id: 0,
        total: grandTotal.value,
        paidAmount: effectivePaid.value,
        debtAmount: debtAmount.value,
        offline: true,
      } as any
      paymentDialog.value = false
      receiptDialog.value = true
      toastStore.success('Chek oflayn saqlandi')
      clearCart()
      loadList(listPage.value)
      return
    }

    const order = await ordersStore.createOrder(payload)

    lastOrder.value = order
    paymentDialog.value = false
    receiptDialog.value = true
    toastStore.success('Chek muvaffaqiyatli yakunlandi')

    clearCart()
    loadList(listPage.value)
    loadRecent()
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik yuz berdi')
  } finally {
    checkingOut.value = false
  }
}

function printReceipt() {
  window.print()
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}

// ─────────────────────────── Hotkeys ───────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'F2') {
    e.preventDefault()
    topSearchRef.value?.focus?.()
  } else if (e.key === 'F4') {
    e.preventDefault()
    openPaymentDialog()
  } else if (e.key === 'Escape') {
    if (newCustomerDialog.value || receiptDialog.value || paymentDialog.value || pendingDialog.value) return
    e.preventDefault()
    if (cart.value.length) clearCart()
  }
}

// ─────────────────────────── Onlayn holat kuzatuvi ───────────────────────────
watch(isOnline, async online => {
  if (online) {
    toastStore.success('Internet tiklandi — sinxronlanmoqda...')
    await offlineStore.syncPending()
    await refreshOfflineCache()
    loadList(listPage.value)
    loadRecent()
  } else {
    toastStore.error("Internet uzildi — oflayn rejimda davom etilmoqda")
  }
})

onMounted(async () => {
  await offlineStore.loadPending()
  await refreshOfflineCache()
  loadList(1)
  loadRecent()
  focusScan()
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
.pos-row {
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.06);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }
}

.pos-table-compact :deep(td),
.pos-table-compact :deep(th) {
  padding-block: 4px;
  font-size: 0.8125rem;
}

.pos-pay-card {
  cursor: pointer;
  transition: all 0.15s;
}

.pos-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;

  &__btn {
    min-height: 44px;
    font-size: 1rem;
  }

  &__btn--clear {
    grid-column: span 3;
  }
}

kbd {
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  font-family: inherit;
}
</style>
