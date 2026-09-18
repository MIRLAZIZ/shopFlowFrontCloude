<template>
  <div class="pos-page">
    <!-- ═══════════════ TOP BAR ═══════════════ -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
      <div class="d-flex align-center gap-3">
        <VChip :color="isOnline ? 'success' : 'error'" size="small" variant="flat">
          <VIcon start :icon="isOnline ? 'tabler-wifi' : 'tabler-wifi-off'" size="14" />
          {{ isOnline ? 'Onlayn' : 'Oflayn' }}
        </VChip>
        <span v-if="cashierName" class="text-medium-emphasis">
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
      <!-- ═══════════════ 1) MAHSULOTLAR RO'YXATI (doimiy) ═══════════════ -->
      <VCol cols="12" md="5">
        <VCard title="Mahsulotlar" class="h-100 d-flex flex-column">
          <VCardText>
            <VTextField
              ref="topSearchRef"
              v-model="listSearch"
              placeholder="Mahsulot nomi, barcode yoki kod..."
              prepend-inner-icon="tabler-search"
              density="comfortable"
              clearable
              class="mb-3"
              @update:model-value="debouncedListSearch"
            />

            <VRow dense class="mb-3">
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

          <VTable density="comfortable" fixed-header height="420">
            <thead>
              <tr>
                <th>Barcode / Kod</th>
                <th>Mahsulot nomi</th>
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
                <td>{{ p.name }}</td>
                <td class="text-end">{{ formatMoney(p.selling_price) }}</td>
                <td class="text-end">
                  <VChip :color="stockColor(p)" size="small" variant="tonal">
                    {{ p.quantity }}
                  </VChip>
                </td>
              </tr>
              <tr v-if="!productsStore.products.length">
                <td colspan="4" class="text-center text-medium-emphasis py-6">
                  Mahsulot topilmadi
                </td>
              </tr>
            </tbody>
          </VTable>

          <VCardText class="d-flex justify-space-between align-center">
            <span class="text-caption text-medium-emphasis">
              Topildi: {{ productsStore.total }} ta mahsulot
            </span>
            <VPagination
              v-model="listPage"
              :length="Math.max(Math.ceil(productsStore.total / productsStore.limit), 1)"
              :total-visible="5"
              density="compact"
              @update:model-value="loadList"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- ═══════════════ 2) SAVAT (CHEK) ═══════════════ -->
      <VCol cols="12" md="4">
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
              Savat bo'sh — ro'yxatdan mahsulot tanlang yoki barcode skanerlang
            </p>

            <VTable v-else density="comfortable">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th style="width: 110px">Miqdor</th>
                  <th style="width: 70px">Chegirma %</th>
                  <th class="text-end">Jami</th>
                  <th style="width: 36px" />
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
                        style="width: 56px"
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

            <VRow dense class="mb-2">
              <VCol cols="7">
                <AppTextField
                  v-model.number="overallDiscountValue"
                  type="number"
                  label="Umumiy chegirma"
                  density="compact"
                />
              </VCol>
              <VCol cols="5">
                <AppSelect
                  v-model="overallDiscountType"
                  :items="overallDiscountTypeOptions"
                  item-title="title"
                  item-value="value"
                  density="compact"
                />
              </VCol>
            </VRow>
            <AppTextField v-model="note" label="Izoh (ixtiyoriy)" density="compact" class="mb-4" />

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
            <div class="d-flex justify-space-between text-h6">
              <span>To'lanadi:</span>
              <span>{{ formatMoney(grandTotal) }} so'm</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- ═══════════════ 3) TO'LOV ═══════════════ -->
      <VCol cols="12" md="3">
        <VCard title="To'lov" class="h-100">
          <VCardText>
            <div class="d-flex justify-space-between mb-4">
              <span class="text-medium-emphasis">To'lanadigan summa:</span>
              <span class="text-h6">{{ formatMoney(grandTotal) }} so'm</span>
            </div>

            <VRow dense class="mb-3">
              <VCol v-for="opt in paymentOptions" :key="opt.value" cols="6">
                <VCard
                  :variant="paymentType === opt.value ? 'flat' : 'tonal'"
                  :color="paymentType === opt.value ? 'primary' : undefined"
                  class="pos-pay-card text-center pa-3"
                  @click="paymentType = opt.value"
                >
                  <VIcon :icon="opt.icon" size="22" class="mb-1" />
                  <div class="text-caption">{{ opt.title }}</div>
                </VCard>
              </VCol>
            </VRow>

            <template v-if="paymentType !== 'mixed'">
              <AppTextField
                v-model.number="paidAmount"
                type="number"
                label="Berilgan summa"
                class="mb-3"
              />
            </template>
            <template v-else>
              <AppTextField
                v-model.number="mixedCash"
                type="number"
                label="Naqd summasi"
                class="mb-2"
              />
              <AppTextField
                v-model.number="mixedCard"
                type="number"
                label="Karta summasi"
                class="mb-3"
              />
            </template>

            <div v-if="changeAmount > 0" class="d-flex justify-space-between mb-2 text-success">
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
                :loading="customerLoading"
                clearable
                no-filter
                @update:search="onCustomerSearch"
              >
                <template #append>
                  <VBtn icon size="small" variant="text" @click="newCustomerDialog = true">
                    <VIcon icon="tabler-user-plus" />
                  </VBtn>
                </template>
              </VAutocomplete>
            </div>

            <VBtn
              block
              size="large"
              color="primary"
              class="mb-3"
              :disabled="!cart.length || checkingOut"
              :loading="checkingOut"
              @click="checkout"
            >
              To'lash (F4)
            </VBtn>

            <div class="d-flex flex-column gap-2">
              <VBtn
                variant="tonal"
                prepend-icon="tabler-device-floppy"
                :disabled="!cart.length"
                @click="holdSale"
              >
                Vaqtincha saqlash
                <VChip v-if="heldSales.length" size="x-small" class="ml-2">{{ heldSales.length }}</VChip>
              </VBtn>
              <VBtn
                variant="tonal"
                color="error"
                prepend-icon="tabler-x"
                :disabled="!cart.length"
                @click="clearCart()"
              >
                Bekor qilish (Esc)
              </VBtn>
            </div>

            <VExpansionPanels v-if="heldSales.length" class="mt-3" variant="accordion">
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

    <!-- Muvaffaqiyatli chek -->
    <VDialog v-model="receiptDialog" max-width="380">
      <VCard title="Chek yakunlandi ✅">
        <VCardText v-if="lastOrder">
          <div class="d-flex justify-space-between mb-1">
            <span>Chek raqami:</span>
            <span>#{{ lastOrder.id }}</span>
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
import { useOrdersStore } from '@/@core/stores/orders'
import { useProductsStore } from '@/@core/stores/products'
import { useToastStore } from '@/@core/stores/toast.store'
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

function loadList(page: number = 1) {
  listPage.value = page
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

// ─────────────────────────── To'lov ───────────────────────────
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

watch(grandTotal, val => {
  if (paymentType.value !== 'mixed') paidAmount.value = val
})
watch(paymentType, val => {
  if (val !== 'mixed') {
    paidAmount.value = grandTotal.value
  } else {
    mixedCash.value = grandTotal.value
    mixedCard.value = 0
  }
})

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
  if (!value) return
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
  try {
    await ordersStore.fetchOrders(1)
    recentOrders.value = ordersStore.orders.slice(0, 5)
  } catch {
    // jim turadi — asosiy funksionallikka ta'sir qilmasin
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

// ─────────────────────────── Checkout ───────────────────────────
const checkingOut = ref(false)
const receiptDialog = ref(false)
const lastOrder = ref<Order | null>(null)

async function checkout() {
  if (!cart.value.length) return

  if (debtAmount.value > 0 && !customerId.value) {
    toastStore.error('Qarz uchun mijoz tanlanishi shart')
    return
  }

  if (paymentType.value === 'mixed') {
    const sum = (Number(mixedCash.value) || 0) + (Number(mixedCard.value) || 0)
    if (Math.abs(sum - effectivePaid.value) > 0.05) {
      toastStore.error("Aralash to'lov summalari mos kelmadi")
      return
    }
  }

  checkingOut.value = true
  try {
    // Umumiy chegirmani har bir qatorga mutanosib taqsimlaymiz, shunda
    // backend'ga bitta jami discount sifatida ketadi
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

    const order = await ordersStore.createOrder(payload)

    lastOrder.value = order
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
    checkout()
  } else if (e.key === 'Escape') {
    if (newCustomerDialog.value || receiptDialog.value) return
    e.preventDefault()
    if (cart.value.length) clearCart()
  }
}

onMounted(() => {
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

.pos-pay-card {
  cursor: pointer;
  transition: all 0.15s;
}

kbd {
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  font-family: inherit;
}
</style>
