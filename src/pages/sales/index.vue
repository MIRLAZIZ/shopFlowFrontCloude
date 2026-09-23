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

    <!-- ═══════════════ SAVAT TABLARI ═══════════════ -->
    <div class="d-flex align-center gap-2 mb-3 flex-wrap">
      <VChip
        v-for="b in baskets"
        :key="b.id"
        :color="b.id === activeBasketId ? 'primary' : undefined"
        :variant="b.id === activeBasketId ? 'flat' : 'tonal'"
        class="cursor-pointer"
        @click="activeBasketId = b.id"
      >
        {{ b.label }}
        <VChip v-if="b.cart.length" size="x-small" class="ml-1">{{ b.cart.length }}</VChip>
        <VIcon
          v-if="baskets.length > 1"
          icon="tabler-x"
          size="14"
          class="ml-1"
          @click.stop="closeBasket(b.id)"
        />
      </VChip>
      <VBtn icon size="small" variant="tonal" @click="addBasket">
        <VIcon icon="tabler-plus" />
      </VBtn>
    </div>

    <VRow>
      <!-- ═══════════════ 1) MAHSULOTLAR RO'YXATI ═══════════════ -->
      <VCol cols="12" md="3">
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
                <th class="text-end">Qold.</th>
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
            <span class="text-caption text-medium-emphasis">{{ productsStore.total }} ta</span>
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

      <!-- ═══════════════ 2) SAVAT (CHEK) ═══════════════ -->
      <VCol cols="12" md="6">
        <VCard :title="activeBasket.label" class="h-100">
          <template #append>
            <VBtn
              v-if="cart.length"
              size="small"
              variant="text"
              color="error"
              @click="emptyActiveBasket()"
            >
              Tozalash
            </VBtn>
          </template>

          <VCardText>
            <p v-if="!cart.length" class="text-medium-emphasis text-center py-10">
              Savat bo'sh — chapdan mahsulot tanlang yoki barcode skanerlang
            </p>

            <VTable v-else density="comfortable">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th style="width: 120px">Miqdor</th>
                  <th style="width: 110px">Summa</th>
                  <th style="width: 80px">Cheg. %</th>
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
                        style="width: 64px"
                        @focus="targetLineQuantity(line)"
                        @update:model-value="clampQty(line)"
                      />
                      <VBtn icon size="x-small" variant="tonal" @click="stepQty(line, 1)">
                        <VIcon icon="tabler-plus" size="14" />
                      </VBtn>
                    </div>
                  </td>
                  <td>
                    <!--
                      Vazn/summa bo'yicha avto hisoblash: masalan banan 22 000/kg,
                      tarozida 2 dona emas balki 0.68 kg bo'lsa — kassir shu yerga
                      to'g'ridan-to'g'ri to'langan summani (masalan 15 000) kiritadi,
                      miqdor (kg) avtomatik narxga bo'linib hisoblanadi.
                    -->
                    <VTextField
                      :model-value="grossAmount(line)"
                      type="number"
                      density="compact"
                      hide-details
                      @focus="targetLineAmount(line)"
                      @update:model-value="val => onAmountInput(line, val)"
                    />
                  </td>
                  <td>
                    <VTextField
                      v-model.number="line.discountPercent"
                      type="number"
                      density="compact"
                      hide-details
                      min="0"
                      max="100"
                      @focus="targetLineDiscount(line)"
                    />
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
                  label="Umumiy chegirma"
                  @focus="targetOverallDiscount()"
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
            <div class="d-flex justify-space-between mb-3">
              <span class="text-medium-emphasis">To'lanadi:</span>
              <span class="text-h6">{{ formatMoney(grandTotal) }} so'm</span>
            </div>

            <VRow dense class="mb-3">
              <VCol v-for="opt in paymentOptions" :key="opt.value" cols="6">
                <VCard
                  :variant="paymentType === opt.value ? 'flat' : 'tonal'"
                  :color="paymentType === opt.value ? 'primary' : undefined"
                  class="pos-pay-card text-center pa-2"
                  @click="selectPaymentType(opt.value)"
                >
                  <VIcon :icon="opt.icon" size="20" class="mb-1" />
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
                @focus="targetPaidAmount()"
                @update:model-value="paidAmountTouched = true"
              />
            </template>
            <template v-else>
              <AppTextField
                v-model.number="mixedCash"
                type="number"
                label="Naqd"
                class="mb-2"
                @focus="targetMixedCash()"
                @update:model-value="mixedTouched = true"
              />
              <AppTextField
                v-model.number="mixedCard"
                type="number"
                label="Karta"
                class="mb-3"
                @focus="targetMixedCard()"
                @update:model-value="mixedTouched = true"
              />
            </template>

            <div class="d-flex justify-space-between mb-1 text-body-2">
              <span class="text-medium-emphasis">To'landi:</span>
              <span>{{ formatMoney(effectivePaid) }} so'm</span>
            </div>
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
                :disabled="!isOnline"
                clearable
                no-filter
                density="compact"
                @update:search="onCustomerSearch"
              >
                <template #append>
                  <VBtn icon size="small" variant="text" :disabled="!isOnline" @click="newCustomerDialog = true">
                    <VIcon icon="tabler-user-plus" />
                  </VBtn>
                </template>
              </VAutocomplete>
              <p v-if="!isOnline" class="text-caption text-warning mt-1">
                Oflaynda faqat keshlangan mijozlardan tanlanadi
              </p>
            </div>

            <VBtn
              block
              size="large"
              color="primary"
              :disabled="!cart.length || checkingOut"
              :loading="checkingOut"
              @click="checkout"
            >
              To'lash (F4)
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ═══════════════ RAQAMLI PANEL + SO'NGGI CHEKLAR ═══════════════ -->
    <VRow class="mt-4">
      <VCol cols="12" md="4">
        <VCard title="Raqamli panel">
          <template #append>
            <span class="text-caption text-medium-emphasis">{{ activeTargetLabel }}</span>
          </template>
          <VCardText>
            <div class="pos-keypad">
              <VBtn
                v-for="key in ['7','8','9','4','5','6','1','2','3','0','00','⌫']"
                :key="key"
                variant="tonal"
                class="pos-keypad__btn"
                :disabled="!activeTarget"
                @click="pressKey(key)"
              >
                {{ key }}
              </VBtn>
              <VBtn
                variant="tonal"
                color="error"
                class="pos-keypad__btn pos-keypad__btn--clear"
                :disabled="!activeTarget"
                @click="pressClear"
              >
                C
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="8">
        <VCard title="So'nggi cheklar">
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
      </VCol>
    </VRow>

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
              <div class="text-body-2">{{ formatMoney(o.payload?.paidAmount ?? 0) }} so'm</div>
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

interface Basket {
  id: number
  label: string
  cart: CartLine[]
  overallDiscountValue: number
  overallDiscountType: 'percent' | 'amount'
  note: string
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

// ─────────────────────────── Bir nechta savat (tablar) ───────────────────────────
let nextBasketId = 2
function makeBasket(id: number): Basket {
  return {
    id,
    label: `Savat ${id}`,
    cart: [],
    overallDiscountValue: 0,
    overallDiscountType: 'percent',
    note: '',
  }
}

const baskets = ref<Basket[]>([makeBasket(1)])
const activeBasketId = ref(1)
const activeBasket = computed(
  () => baskets.value.find(b => b.id === activeBasketId.value) ?? baskets.value[0],
)

function addBasket() {
  const b = makeBasket(nextBasketId++)
  baskets.value.push(b)
  activeBasketId.value = b.id
  paidAmountTouched.value = false
  mixedTouched.value = false
  focusScan()
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

function emptyActiveBasket() {
  activeBasket.value.cart = []
  activeBasket.value.overallDiscountValue = 0
  activeBasket.value.note = ''
  paidAmountTouched.value = false
  mixedTouched.value = false
  customerId.value = null
  paymentType.value = 'cash'
}

// Eski kod bazasi bilan moslik uchun: cart/overallDiscount... hozir faol
// savatga "proksi" qiladi — shu orqali pastdagi barcha hisob-kitob
// funksiyalari o'zgarishsiz ishlayveradi.
const cart = computed({
  get: () => activeBasket.value.cart,
  set: v => { activeBasket.value.cart = v },
})
const overallDiscountValue = computed({
  get: () => activeBasket.value.overallDiscountValue,
  set: v => { activeBasket.value.overallDiscountValue = v },
})
const overallDiscountType = computed({
  get: () => activeBasket.value.overallDiscountType,
  set: v => { activeBasket.value.overallDiscountType = v },
})
const note = computed({
  get: () => activeBasket.value.note,
  set: v => { activeBasket.value.note = v },
})

// ─────────────────────────── Oflayn kesh ───────────────────────────
async function refreshOfflineCache() {
  if (!isOnline.value) return
  try {
    const [productsRes, customersRes, debtsRes] = await Promise.all([
      $api('/products?page=1&limit=1000') as Promise<any>,
      $api('/customers?page=1&limit=1000') as Promise<any>,
      $api('/debts?page=1&limit=1000&status=open') as Promise<any>,
    ])
    await offlineStore.cacheProducts(productsRes?.data?.data ?? [])
    await offlineStore.cacheCustomers(customersRes?.data?.data ?? [])
    await offlineStore.cacheDebts(debtsRes?.data?.data ?? [])
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
    const filtered = cached.filter((p: any) => {
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
    cart.value = [
      ...cart.value,
      {
        productId: product.id,
        name: product.name,
        price: product.selling_price ?? 0,
        quantity: 1,
        discountPercent: 0,
        availableQuantity: availableQty,
      },
    ]
  }
}

async function onScanEnter() {
  const value = scanQuery.value?.trim()
  if (!value) return

  if (!isOnline.value) {
    const cached = await offlineStore.getCachedProducts()
    const match = cached.find((p: any) => p.barcode === value || p.quick_code === value)
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

// ⚠️ Vazn bo'yicha sotiladigan mahsulotlar (masalan meva-sabzavot) uchun
// miqdor butun son bo'lishi shart emas — shuning uchun faqat musbatlikni
// tekshiramiz, 1 gacha yaxlitlab yubormaymiz.
function clampQty(line: CartLine) {
  if (!line.quantity || line.quantity <= 0) line.quantity = 0.001
  if (line.quantity > line.availableQuantity) {
    line.quantity = line.availableQuantity
    toastStore.error("Omborda shuncha mahsulot yo'q")
  }
}

function stepQty(line: CartLine, delta: number) {
  line.quantity = round2((Number(line.quantity) || 0) + delta)
  clampQty(line)
}

// Chegirmasiz, xom summa (narx x miqdor) — "Summa" ustunida ko'rsatiladi
function grossAmount(line: CartLine) {
  return round2(line.price * line.quantity)
}

// Kassir "Summa" ustuniga to'g'ridan-to'g'ri pul miqdorini kiritsa
// (masalan tarozidagi banan uchun 15 000 so'm to'lanadi, narxi 22 000/kg
// bo'lsa), miqdor (kg) avtomatik shu summadan hisoblab olinadi.
function onAmountInput(line: CartLine, value: number | string) {
  const amount = Number(value)
  if (!line.price || Number.isNaN(amount)) return
  line.quantity = round2(amount / line.price)
  clampQty(line)
}

function lineDiscountAmount(line: CartLine) {
  return round2((line.price * line.quantity * (line.discountPercent || 0)) / 100)
}

function round2(value: number) {
  return Math.round(value * 1000) / 1000
}

const subtotal = computed(() => cart.value.reduce((sum, l) => sum + l.price * l.quantity, 0))
const lineDiscountsTotal = computed(() =>
  round2(cart.value.reduce((sum, l) => sum + lineDiscountAmount(l), 0)),
)

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

// "touched": foydalanuvchi summani qo'lda o'zgartirganini bildiradi — savat
// keyin o'zgarsa ham (masalan chegirma qo'shilsa) ataylab kiritilgan
// QISMAN to'lov (qarz uchun) endi ustidan qayta yozilmaydi.
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

const effectivePaid = computed(() =>
  paymentType.value === 'mixed'
    ? (Number(mixedCash.value) || 0) + (Number(mixedCard.value) || 0)
    : Number(paidAmount.value) || 0,
)

const changeAmount = computed(() => Math.max(effectivePaid.value - grandTotal.value, 0))
const debtAmount = computed(() => Math.max(grandTotal.value - effectivePaid.value, 0))

// ─────────────────────────── Raqamli panel (istalgan faol maydonga yozadi) ───────────────────────────
interface NumericTarget {
  label: string
  get: () => number
  set: (v: number) => void
}
const activeTarget = ref<NumericTarget | null>(null)
const keypadFresh = ref(true)
const activeTargetLabel = computed(() => (activeTarget.value ? activeTarget.value.label : 'Maydon tanlanmagan'))

function bindTarget(target: NumericTarget) {
  activeTarget.value = target
  keypadFresh.value = true
}

function targetPaidAmount() {
  bindTarget({
    label: 'Berilgan summa',
    get: () => paidAmount.value,
    set: v => { paidAmount.value = v; paidAmountTouched.value = true },
  })
}
function targetMixedCash() {
  bindTarget({
    label: 'Naqd',
    get: () => mixedCash.value,
    set: v => { mixedCash.value = v; mixedTouched.value = true },
  })
}
function targetMixedCard() {
  bindTarget({
    label: 'Karta',
    get: () => mixedCard.value,
    set: v => { mixedCard.value = v; mixedTouched.value = true },
  })
}
function targetOverallDiscount() {
  bindTarget({
    label: 'Umumiy chegirma',
    get: () => overallDiscountValue.value,
    set: v => { overallDiscountValue.value = v },
  })
}
function targetLineQuantity(line: CartLine) {
  bindTarget({
    label: `${line.name} — miqdor`,
    get: () => line.quantity,
    set: v => { line.quantity = v; clampQty(line) },
  })
}
function targetLineAmount(line: CartLine) {
  bindTarget({
    label: `${line.name} — summa`,
    get: () => grossAmount(line),
    set: v => onAmountInput(line, v),
  })
}
function targetLineDiscount(line: CartLine) {
  bindTarget({
    label: `${line.name} — chegirma %`,
    get: () => line.discountPercent,
    set: v => { line.discountPercent = v },
  })
}

function pressKey(key: string) {
  if (!activeTarget.value) return
  if (key === '⌫') {
    const current = String(activeTarget.value.get())
    const next = current.slice(0, -1)
    activeTarget.value.set(next ? Number(next) : 0)
    keypadFresh.value = false
    return
  }
  const current = keypadFresh.value ? '' : String(activeTarget.value.get() || '')
  activeTarget.value.set(Number(current + key) || 0)
  keypadFresh.value = false
}

function pressClear() {
  activeTarget.value?.set(0)
  keypadFresh.value = false
}

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
      receiptDialog.value = true
      toastStore.success('Chek oflayn saqlandi')
      emptyActiveBasket()
      loadList(listPage.value)
      return
    }

    const order = await ordersStore.createOrder(payload)

    lastOrder.value = order
    receiptDialog.value = true
    toastStore.success('Chek muvaffaqiyatli yakunlandi')

    emptyActiveBasket()
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
    if (newCustomerDialog.value || receiptDialog.value || pendingDialog.value) return
    e.preventDefault()
    if (cart.value.length) emptyActiveBasket()
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
    toastStore.error('Internet uzildi — oflayn rejimda davom etilmoqda')
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
  gap: 8px;

  &__btn {
    min-height: 48px;
    font-size: 1.05rem;
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
