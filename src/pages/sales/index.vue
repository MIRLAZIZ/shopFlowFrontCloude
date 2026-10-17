<template>
  <div class="pos-page">
    <!-- ═══════════════ TOP BAR ═══════════════ -->
    <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-3">
      <div class="d-flex align-center gap-3">
        <VChip :color="isOnline ? 'success' : 'error'" size="small" variant="flat">
          <VIcon start :icon="isOnline ? 'tabler-wifi' : 'tabler-wifi-off'" size="14" />
          {{ isOnline ? 'Onlayn' : 'Oflayn' }}
        </VChip>

        <VChip v-if="offlineStore.pendingOrders.length" :color="offlineStore.failedCount ? 'error' : 'warning'"
          size="small" variant="tonal" class="cursor-pointer" @click="pendingDialog = true">
          <VIcon start icon="tabler-clock-exclamation" size="14" />
          {{ offlineStore.pendingCount }} kutilmoqda
          <span v-if="offlineStore.failedCount">, {{ offlineStore.failedCount }} xato</span>
        </VChip>

        <VChip :color="printerConnected ? 'success' : undefined" size="small"
          :variant="printerConnected ? 'flat' : 'tonal'" class="cursor-pointer" @click="printerDialog = true">
          <VIcon start :icon="printerConnected ? 'tabler-printer' : 'tabler-printer-off'" size="14" />
          {{ printerConnected ? 'Printer ulangan' : 'Printer ulanmagan' }}
        </VChip>

        <span v-if="cashierName" class="text-medium-emphasis text-body-2">
          Kassir: <strong>{{ cashierName }}</strong>
        </span>
      </div>
    </div>

    <!-- ═══════════════ BARCODE (kichik, chapda) + SAVAT TABLARI ═══════════════ -->
    <div class="d-flex align-center gap-3 mb-3 flex-wrap">
      <VTextField ref="barcodeInputRef" v-model="barcodeQuery" placeholder="Shtrix kod..."
        prepend-inner-icon="tabler-barcode" density="compact" variant="outlined" class="pos-barcode-input"
        @keydown="onBarcodeKeydown" />
      <span class="text-caption text-medium-emphasis pos-barcode-hint">
        Raqam yozib: <kbd>+</kbd> qo'shish · <kbd>−</kbd> ayirish · <kbd>×</kbd> narx · <kbd>÷</kbd> summa→miqdor ·
        <kbd>F6</kbd> umumiy / <kbd>F7</kbd> mahsulot chegirma
      </span>

      <VChip v-for="b in baskets" :key="b.id" :color="b.id === activeBasketId ? 'primary' : undefined"
        :variant="b.id === activeBasketId ? 'flat' : 'tonal'" class="cursor-pointer" @click="activeBasketId = b.id">
        {{ b.label }}
        <VChip v-if="b.cart.length" size="x-small" class="ml-1">{{ b.cart.length }}</VChip>
        <VIcon v-if="baskets.length > 1" icon="tabler-x" size="14" class="ml-1" @click.stop="closeBasket(b.id)" />
      </VChip>
      <VBtn icon size="small" variant="tonal" @click="addBasket">
        <VIcon icon="tabler-plus" />
      </VBtn>
    </div>

    <VRow>
      <!-- ═══════════════ SAVAT (katta, scroll bo'ladigan) ═══════════════ -->
      <VCol cols="12" md="8">
        <VCard :title="activeBasket.label" class="h-100">
          <template #append>
            <VBtn v-if="cart.length" size="small" variant="text" color="error" @click="emptyActiveBasket()">
              Tozalash
            </VBtn>
          </template>

          <VCardText>
            <!-- Savat qatorlari: ixcham, scroll bo'ladigan -->
            <div class="pos-cart-scroll">
              <p v-if="!cart.length" class="text-medium-emphasis text-center py-8">
                Savat bo'sh — pastdan mahsulot qidiring yoki barcode skanerlang
              </p>

              <div v-else class="pos-cart-lines">
                <div v-for="line in cart" :key="line.productId" class="pos-cart-line"
                  :class="{ 'pos-cart-line--active': activeLine?.productId === line.productId }"
                  @click="targetLineQuantity(line)">
                  <div class="pos-cart-line__info">
                    <div class="text-body-2 font-weight-medium">{{ line.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatMoney(line.price) }} so'm / {{ line.unit }}
                    </div>
                  </div>

                  <!-- Miqdor: faqat tugmalar -->
                  <div class="pos-cart-line__qty">
                    <!-- <VBtn icon size="x-small" variant="tonal" @click="stepQty(line, -1)">
                      <VIcon icon="tabler-minus" size="14" />
                    </VBtn> -->
                    <VBtn size="small" variant="tonal" :color="isTarget(line, 'qty') ? 'primary' : undefined"
                      class="pos-cart-line__qty-value">
                      {{ formatQty(line.quantity) }}
                      <span class="pos-cart-line__unit">{{ line.unit }}</span>
                    </VBtn>
                    <!-- <VBtn icon size="x-small" variant="tonal" @click="stepQty(line, 1)">
                      <VIcon icon="tabler-plus" size="14" />
                    </VBtn> -->
                  </div>

                  <!-- Summa: bosilsa raqamli panel shu yerga yoziladi -->
                  <VBtn size="small" variant="tonal" :color="isTarget(line, 'amount') ? 'primary' : undefined"
                    class="pos-cart-line__amount" @click="targetLineAmount(line)">
                    {{ formatMoney(grossAmount(line)) }}
                  </VBtn>

                  <!-- Narx: bosilsa raqamli panelda * orqali narx tushirish mumkin -->
                  <VBtn size="small" variant="tonal" :color="isTarget(line, 'price') ? 'primary' : undefined"
                    class="pos-cart-line__price" @click="targetLinePrice(line)">
                    {{ formatMoney(line.price) }}
                  </VBtn>

                  <!-- Chegirma: bosilsa F7 orqali raqamli panelda kiritiladi -->
                  <VBtn size="small" variant="tonal" :color="isTarget(line, 'discount') ? 'primary' : undefined"
                    class="pos-cart-line__discount" @click="targetLineDiscount(line)">
                    {{ formatMoney(line.discount) }}
                  </VBtn>

                  <IconBtn size="small" @click="removeFromCart(line.productId)">
                    <VIcon icon="tabler-trash" color="error" />
                  </IconBtn>
                </div>
              </div>
            </div>

            <VDivider class="my-3" />

            <!-- Qidiruv — kichik, pastda -->
            <VTextField ref="nameSearchRef" v-model="nameQuery"
              placeholder="Mahsulot nomi yoki qisqa kod bilan qidirish..." prepend-inner-icon="tabler-search"
              density="compact" clearable class="mb-2" @update:model-value="onNameQueryChange"
              @keydown.enter="onNameEnter" @blur="focusBarcodeSoon" />
            <VTable v-if="nameQuery.trim() && nameResults.length" density="compact" class="pos-mini-table mb-2">
              <tbody>
                <tr v-for="p in nameResults" :key="p.id" :class="{ 'pos-row--disabled': p.quantity <= 0 }"
                  @click="pickFromDropdown(p)">
                  <td class="text-caption">{{ p.barcode || p.quick_code || '-' }}</td>
                  <td class="text-caption">{{ p.name }}</td>
                  <td class="text-end text-caption">{{ formatMoney(p.selling_price) }}</td>
                  <td class="text-end">
                    <VChip size="x-small" :color="p.quantity <= 0 ? 'error' : 'success'" variant="tonal">
                      {{ p.quantity }}
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
            <p v-else-if="nameQuery.trim() && !nameResults.length" class="text-caption text-medium-emphasis mb-2">
              Hech narsa topilmadi
            </p>

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
            <div class="d-flex justify-space-between text-h6 mb-3">
              <span>To'lanadi:</span>
              <span>{{ formatMoney(grandTotal) }} so'm</span>
            </div>

            <VBtn block size="large" color="primary" :disabled="!cart.length" @click="paymentSectionOpen = true">
              To'lov (F4)
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- ═══════════════ RAQAMLI PANEL + TO'LOV ═══════════════ -->
      <VCol cols="12" md="4">
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-2">
              <div class="d-flex gap-1">
                <VBtn icon size="small" :variant="autoPrint ? 'flat' : 'tonal'"
                  :color="autoPrint ? 'primary' : undefined" title="Avtomatik chek chiqarish (printer ulangan bo'lsa)"
                  @click="autoPrint = !autoPrint">
                  <VIcon icon="tabler-printer" size="18" />
                </VBtn>
                <VBtn icon size="small" variant="tonal" color="error" title="Barcha chegirmalarni bekor qilish"
                  @click="resetAllDiscounts">
                  <VIcon icon="tabler-discount-off" size="18" />
                </VBtn>
              </div>
              <span class="text-caption text-medium-emphasis text-end">{{ activeTargetLabel }}</span>
            </div>

            <div class="pos-keypad">
              <VBtn v-for="key in ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '⌫']" :key="key"
                variant="tonal" class="pos-keypad__btn" @click="pressKey(key)">
                {{ key }}
              </VBtn>
            </div>

            <div class="pos-keypad-ops mt-2">
              <VBtn variant="tonal" color="success" :disabled="!activeLine" @click="applyOp('+')">+</VBtn>
              <VBtn variant="tonal" color="error" :disabled="!activeLine" @click="applyOp('-')">−</VBtn>
              <VBtn variant="tonal" :disabled="!activeLine" @click="applyOp('*')">×</VBtn>
              <VBtn variant="tonal" :disabled="!activeLine" @click="applyOp('/')">÷</VBtn>
            </div>

            <div class="pos-keypad-ops mt-2">
              <VBtn variant="tonal" color="warning" class="flex-grow-1" @click="applyF6">
                F6 · Umumiy chegirma
              </VBtn>
              <VBtn variant="tonal" color="warning" class="flex-grow-1" :disabled="!activeLine" @click="applyF7">
                F7 · Mahsulot chegirma
              </VBtn>
            </div>

            <div class="d-flex gap-2 mt-2">
              <VBtn variant="tonal" color="error" class="flex-grow-1" @click="clearBarcodeInput">
                C
              </VBtn>
              <VBtn variant="tonal" color="primary" class="flex-grow-1" @click="onBarcodeEnter">
                Enter ↵
              </VBtn>
            </div>

            <VDivider class="my-3" />

            <div class="text-caption text-medium-emphasis mb-2">Tezkor miqdor (tanlangan qatorga)</div>
            <div class="d-flex gap-1 flex-wrap">
              <VBtn v-for="n in [1, 5, 10, 20, 50]" :key="n" size="small" variant="tonal" :disabled="!activeLine"
                @click="quickAddQty(n)">
                +{{ n }}
              </VBtn>
            </div>

            <VDivider class="my-3" />

            <div class="d-flex flex-wrap gap-2">
              <VChip size="small" variant="tonal"><kbd>F2</kbd>&nbsp;Qidirish</VChip>
              <VChip size="small" variant="tonal"><kbd>F4</kbd>&nbsp;To'lov</VChip>
              <VChip size="small" variant="tonal"><kbd>Esc</kbd>&nbsp;Bekor qilish</VChip>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ═══════════════ TO'LOV MODALI ═══════════════ -->
    <VDialog v-model="paymentSectionOpen" max-width="520">
      <VCard>
        <VCardItem>
          <VCardTitle>To'lov</VCardTitle>
          <template #append>
            <VBtn icon variant="text" size="small" @click="paymentSectionOpen = false">
              <VIcon icon="tabler-x" />
            </VBtn>
          </template>
        </VCardItem>

        <VCardText>
          <div class="d-flex justify-space-between align-center mb-3">
            <span class="text-medium-emphasis">To'lanadi:</span>
            <span class="text-h5 font-weight-bold">{{ formatMoney(grandTotal) }} so'm</span>
          </div>

          <VTabs v-model="paymentTab" density="compact" class="mb-4">
            <VTab value="pay">To'lov</VTab>
            <VTab value="debt">
              Qarz
              <VChip v-if="debtAmount > 0" size="x-small" color="error" class="ml-1">
                {{ formatMoney(debtAmount) }}
              </VChip>
            </VTab>
          </VTabs>

          <div v-if="paymentTab === 'pay'">
            <VTextField ref="cashInputRef" v-model.number="mixedCash" type="number" label="Naqd" suffix="so'm"
              variant="outlined" class="mb-3" @update:model-value="mixedTouched = true"
              @keydown.enter.prevent="checkout" />

            <VTextField v-model.number="mixedCard" type="number" label="Karta" suffix="so'm" variant="outlined"
              class="mb-3" @update:model-value="mixedTouched = true" @keydown.enter.prevent="checkout">
              <template #prepend>
                <VBtn icon size="small" variant="tonal" color="primary" title="Qolgan summani kartaga hisoblash"
                  @click="autoFillCard">
                  <VIcon icon="tabler-calculator" size="18" />
                </VBtn>
              </template>
            </VTextField>

            <div class="d-flex gap-2 flex-wrap mb-4">
              <VBtn size="small" variant="tonal" @click="fillAllCash">To'liq naqd</VBtn>
              <VBtn size="small" variant="tonal" @click="fillAllCard">To'liq karta</VBtn>
            </div>

            <div class="d-flex justify-space-between mb-1 text-body-2">
              <span class="text-medium-emphasis">To'landi:</span>
              <span>{{ formatMoney(effectivePaid) }} so'm</span>
            </div>
            <div v-if="changeAmount > 0" class="d-flex justify-space-between mb-1 text-success">
              <span>Qaytim:</span>
              <span class="font-weight-medium">{{ formatMoney(changeAmount) }} so'm</span>
            </div>
            <div v-if="debtAmount > 0" class="d-flex justify-space-between mb-1 text-error">
              <span>Qarz qoladi:</span>
              <span class="font-weight-medium">{{ formatMoney(debtAmount) }} so'm</span>
            </div>
          </div>

          <div v-else>
            <p class="text-body-2 mb-3">
              Qarz summasi: <strong class="text-error">{{ formatMoney(debtAmount) }} so'm</strong>
              (Naqd + Karta jamidan qolgani avtomatik qarz bo'ladi)
            </p>

            <VAutocomplete v-model="customerId" v-model:search="customerSearch" :items="customersStore.customers"
              item-title="fullName" item-value="id" label="Mijoz" variant="outlined" :loading="customerLoading"
              :disabled="!isOnline" clearable no-filter class="mb-2" @update:search="onCustomerSearch" />

            <VBtn v-if="!newCustomerInline" variant="tonal" prepend-icon="tabler-user-plus" size="small"
              :disabled="!isOnline" @click="newCustomerInline = true">
              Yangi mijoz
            </VBtn>

            <div v-else class="mt-2">
              <VTextField v-model="newCustomer.fullName" label="Ism familiya" variant="outlined" density="compact"
                class="mb-2" />
              <VTextField v-model="newCustomer.phone" label="Telefon" variant="outlined" density="compact"
                class="mb-2" />
              <div class="d-flex gap-2">
                <VBtn size="small" variant="tonal" @click="newCustomerInline = false">Bekor</VBtn>
                <VBtn size="small" color="primary" :disabled="!newCustomer.fullName" @click="createCustomer">
                  Saqlash
                </VBtn>
              </div>
            </div>

            <p v-if="!isOnline" class="text-caption text-warning mt-2">
              Oflaynda faqat keshlangan mijozlardan tanlanadi
            </p>
          </div>

          <VDivider class="my-4" />

          <VSwitch v-model="autoPrint" color="primary" density="compact" hide-details
            label="Chekni avtomatik chop etish" class="mb-4" />

          <div class="d-flex gap-2">
            <VBtn variant="tonal" @click="paymentSectionOpen = false">Yopish</VBtn>
            <VBtn size="large" color="primary" class="flex-grow-1" :disabled="checkingOut" :loading="checkingOut"
              @click="checkout">
              Yakunlash
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

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

    <!-- Kutilayotgan (oflayn) cheklar -->
    <VDialog v-model="pendingDialog" max-width="480">
      <VCard title="Kutilayotgan cheklar">
        <VCardText>
          <p v-if="!offlineStore.pendingOrders.length" class="text-medium-emphasis">
            Kutilayotgan chek yo'q
          </p>
          <div v-for="o in offlineStore.pendingOrders" :key="o.localId"
            class="d-flex justify-space-between align-center py-2 border-b">
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
              <VBtn v-if="o.status === 'failed'" size="x-small" variant="tonal" color="primary" :disabled="!isOnline"
                @click="offlineStore.retryOne(o.localId)">
                Qayta urinish
              </VBtn>
              <VBtn size="x-small" variant="text" color="error" @click="offlineStore.discardOne(o.localId)">
                O'chirish
              </VBtn>
            </div>
          </div>
        </VCardText>
        <VCardText class="d-flex justify-end">
          <VBtn variant="tonal" :disabled="!isOnline || offlineStore.syncing" :loading="offlineStore.syncing"
            @click="offlineStore.syncPending()">
            Hammasini sinxronlash
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Chek (yakunlangach) -->
    <VDialog v-model="receiptDialog" max-width="400" scrollable>
      <VCard>
        <VCardText class="pb-0">
          <ReceiptPreview :receipt="receipt" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2 flex-wrap">
          <VBtn variant="text" prepend-icon="tabler-settings" @click="printerDialog = true">
            Printer
          </VBtn>
          <VBtn variant="tonal" prepend-icon="tabler-printer" :loading="printing" @click="printCurrentReceipt">
            Chek chiqarish
          </VBtn>
          <VBtn color="primary" @click="receiptDialog = false">Yopish</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <PrinterSettingsDialog v-model="printerDialog" />
  </div>
</template>

<script lang="ts" setup>
import { useCustomersStore } from '@/@core/stores/customers'
import { useOfflineStore } from '@/@core/stores/offline'
import { useOrdersStore } from '@/@core/stores/orders'
import { Basket, CartLine, makeBasket, usePosStore } from '@/@core/stores/pos'
import { useProductsStore } from '@/@core/stores/products'
import { useToastStore } from '@/@core/stores/toast.store'
import PrinterSettingsDialog from '@/components/PrinterSettingsDialog.vue'
import ReceiptPreview from '@/components/ReceiptPreview.vue'
import { usePrinter } from '@/composables/usePrinter'
import { Order } from '@/interface/order.interface'
import { Product } from '@/interface/products.interface'
import { $api } from '@/utils/api'
import { ReceiptData, receiptFromCart, receiptFromOrder } from '@/utils/receipt'
import { isCountUnit, unitLabelOf } from '@/utils/units'
import { decodeQuantityBarcode, decodeReceiptBarcode } from '@/utils/weightBarcode'
import { useDebounceFn, useOnline } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const router = useRouter()
const posStore = usePosStore()
// Savatlar va to'lov maydonlari Pinia store'da — boshqa sahifaga o'tib
// qaytganda ham, brauzer yangilanganda ham (oflayn bo'lsa ham) saqlanadi.
const { baskets, activeBasketId, nextBasketId, mixedCash, mixedCard, mixedTouched, customerId } =
  storeToRefs(posStore)
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
    posStore.ensureOwner(cashierName.value)
  }
})

// ─────────────────────────── Bir nechta savat (tablar) ───────────────────────────
const activeBasket = computed(
  () => baskets.value.find(b => b.id === activeBasketId.value) ?? baskets.value[0],
)

function addBasket() {
  const b = makeBasket(nextBasketId.value++)
  baskets.value.push(b)
  activeBasketId.value = b.id
  mixedTouched.value = false
  focusBarcode()
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
  mixedCash.value = 0
  mixedCard.value = 0
  mixedTouched.value = false
  customerId.value = null
  activeTarget.value = null
  pending.value = ''
  paymentSectionOpen.value = false
  paymentTab.value = 'pay'
}

const cart = computed({
  get: () => activeBasket.value.cart,
  set: v => { activeBasket.value.cart = v },
})
const overallDiscountValue = computed({
  get: () => activeBasket.value.overallDiscountValue,
  set: v => { activeBasket.value.overallDiscountValue = v },
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
    // jim turadi
  }
}

// ─────────────────────────── Nomi/qisqa kod bo'yicha qidiruv ───────────────────────────
const nameSearchRef = ref()
const nameQuery = ref('')
const nameResults = ref<Product[]>([])

const runNameSearch = useDebounceFn(async (value: string) => {
  if (!value?.trim()) {
    nameResults.value = []
    return
  }
  if (!isOnline.value) {
    const cached = await offlineStore.getCachedProducts()
    const q = value.trim().toLowerCase()
    nameResults.value = cached
      .filter((p: any) => p.name?.toLowerCase().includes(q) || p.quick_code?.toLowerCase().includes(q))
      .slice(0, 8)
    return
  }
  try {
    const res: any = await productsStore.searchProduct({ name: value.trim() })
    nameResults.value = (res?.data ?? []).slice(0, 8)
  } catch {
    nameResults.value = []
  }
}, 300)

function onNameQueryChange(value: string) {
  runNameSearch(value)
}

function pickFromDropdown(p: Product) {
  addToCart(p)
  nameQuery.value = ''
  nameResults.value = []
  focusBarcode()
}

function onNameEnter() {
  if (nameResults.value.length === 1) {
    pickFromDropdown(nameResults.value[0])
  }
}

// ─────────────────────────── Barcode (doim fokusda) ───────────────────────────
const barcodeInputRef = ref()
const barcodeQuery = ref('')

function anyDialogOpen() {
  return paymentSectionOpen.value || receiptDialog.value || pendingDialog.value || printerDialog.value
}

function focusBarcode() {
  // Modal oyna ochiq bo'lsa — fokusni undan tortib olmaymiz
  if (anyDialogOpen()) return
  nextTick(() => barcodeInputRef.value?.focus?.())
}
// Boshqa maydondan (nomi bo'yicha qidiruv, klaviatura amali) chiqilgach,
// skaner har doim tayyor turishi uchun fokus barcode'ga qaytariladi.
function focusBarcodeSoon() {
  setTimeout(() => focusBarcode(), 150)
}

// Barcode input — "buyruq qatori": shtrix-kod/qisqa kod yoki raqam + amal.
//   10 +   → tanlangan qatorga 10 ta qo'shish      (bo'sh + / − → ±1)
//   1800 × → narxni 1800 qilish                    5000 ÷ → summadan miqdor
//   1000 F6 → umumiy chegirma     500 F7 → tanlangan mahsulotga chegirma
let lastBarcodeKeyAt = 0
function onBarcodeKeydown(e: KeyboardEvent) {
  const now = Date.now()
  const fast = now - lastBarcodeKeyAt < 40 // skaner belgilarni juda tez yuboradi
  lastBarcodeKeyAt = now

  if (e.key === 'Enter') {
    e.preventDefault()
    onBarcodeEnter()
    return
  }
  if (!['+', '-', '*', '/'].includes(e.key) || fast) return

  const raw = (barcodeQuery.value ?? '').trim().replace(',', '.')
  const numeric = /^\d+(\.\d+)?$/.test(raw)
  if (raw !== '' && !numeric) return // boshqa matn — odatdagidek yoziladi

  e.preventDefault()
  const line = activeLine.value
  if (!line) {
    toastStore.error('Avval savatdan mahsulotni tanlang')
    return
  }
  if (raw === '') {
    if (e.key === '+') stepQty(line, 1)
    else if (e.key === '-') stepQty(line, -1)
    return
  }
  barcodeQuery.value = ''
  pending.value = raw
  applyOp(e.key as '+' | '-' | '*' | '/')
}

// Barcode inputdagi raqamni (F6/F7/amal uchun) "pending" qiymatga ko'chirish
function consumeBarcodeAsPending() {
  const raw = (barcodeQuery.value ?? '').trim().replace(',', '.')
  if (/^\d+(\.\d+)?$/.test(raw)) {
    pending.value = raw
    barcodeQuery.value = ''
  }
}

async function onBarcodeEnter() {
  const value = barcodeQuery.value?.trim()
  if (!value) return

  // 🏷️ Vaznli shtrix-kod (masalan 5 kg piyoz qadog'i) bo'lsa — mahsulot
  // ID va vazn to'g'ridan-to'g'ri kod ichidan o'qiladi, qidiruv shart emas
  const decoded = decodeQuantityBarcode(value)
  if (decoded) {
    try {
      let product: Product | null = null
      if (!isOnline.value) {
        const cached = await offlineStore.getCachedProducts()
        product = cached.find((p: any) => p.id === decoded.productId) ?? null
      } else {
        const res: any = await $api(`/products/${decoded.productId}`)
        product = res?.data ?? null
      }
      if (!product) {
        toastStore.error('Shtrix-koddagi mahsulot topilmadi')
      } else {
        addToCart(product, decoded.quantity)
        toastStore.success(`${product.name} — ${decoded.quantity} ${unitLabelOf(product)} qo'shildi`)
      }
    } catch {
      toastStore.error('Shtrix-koddagi mahsulot topilmadi')
    }
    barcodeQuery.value = ''
    focusBarcode()
    return
  }

  // 🧾 Chek shtrix-kodi skanerlansa — shu chek "Cheklar" sahifasida ochiladi
  const receiptId = decodeReceiptBarcode(value)
  if (receiptId) {
    barcodeQuery.value = ''
    router.push({ path: '/receipts', query: { order: String(receiptId) } })
    return
  }

  if (!isOnline.value) {
    const cached = await offlineStore.getCachedProducts()
    const match = cached.find((p: any) => p.barcode === value || p.quick_code === value)
    if (match) {
      addToCart(match)
      barcodeQuery.value = ''
    } else {
      toastStore.error('Mahsulot topilmadi (oflayn kesh)')
    }
    focusBarcode()
    return
  }

  try {
    const byBarcode: any = await productsStore.searchProduct({ barcode: value })
    if (byBarcode?.data?.length === 1) {
      addToCart(byBarcode.data[0])
      barcodeQuery.value = ''
      focusBarcode()
      return
    }
    const byQuick: any = await productsStore.searchProduct({ quickCode: value })
    if (byQuick?.data?.length === 1) {
      addToCart(byQuick.data[0])
      barcodeQuery.value = ''
      focusBarcode()
      return
    }
    toastStore.error('Mahsulot topilmadi')
  } catch {
    toastStore.error('Mahsulot topilmadi')
  }
  focusBarcode()
}

// ─────────────────────────── Savat ───────────────────────────
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
  // Dona kabi sanaladigan birliklarda miqdor butun son bo'lishi shart;
  // kg, litr, metr kabilarda kasr (masalan 0.68 kg) mumkin.
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

function round2(value: number) {
  return Math.round(value * 100) / 100
}
function round3(value: number) {
  return Math.round(value * 1000) / 1000
}

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

function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

function resetAllDiscounts() {
  cart.value.forEach(l => { l.discount = 0 })
  overallDiscountValue.value = 0
  toastStore.success('Barcha chegirmalar bekor qilindi')
}

// ─────────────────────────── Raqamli panel (pending buffer + operatorlar) ───────────────────────────
type TargetKind = 'qty' | 'amount' | 'price' | 'discount' | 'mixedCash' | 'mixedCard'
interface NumericTarget {
  label: string
  kind: TargetKind
  lineId: number | null
}
const activeTarget = ref<NumericTarget | null>(null)
const pending = ref('')
const activeTargetLabel = computed(() => (activeTarget.value ? activeTarget.value.label : 'Maydon tanlanmagan'))
const activeLine = computed(() =>
  activeTarget.value?.lineId != null ? cart.value.find(l => l.productId === activeTarget.value!.lineId) ?? null : null,
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

function targetLineQuantity(line: CartLine) {
  bindTarget({ label: `${line.name} — miqdor`, kind: 'qty', lineId: line.productId })
}
function targetLineAmount(line: CartLine) {
  bindTarget({ label: `${line.name} — summa (÷ orqali)`, kind: 'amount', lineId: line.productId })
}
function targetLinePrice(line: CartLine) {
  bindTarget({ label: `${line.name} — narx (× orqali)`, kind: 'price', lineId: line.productId })
}
function targetLineDiscount(line: CartLine) {
  bindTarget({ label: `${line.name} — chegirma (F7 orqali)`, kind: 'discount', lineId: line.productId })
}
function targetMixedCash() {
  bindTarget({ label: 'Naqd', kind: 'mixedCash', lineId: null })
}
function targetMixedCard() {
  bindTarget({ label: 'Karta', kind: 'mixedCard', lineId: null })
}

// Ekrandagi raqamlar paneli BARCODE INPUT'ga yozadi (jismoniy klaviatura
// kabi). Amal (+, −, ×, ÷, F6, F7) bosilganda input'dagi raqam tegishli
// joyga qo'llaniladi, Enter esa shtrix-kod/qisqa kod bo'yicha qidiradi.
function pressKey(key: string) {
  const current = barcodeQuery.value ?? ''
  barcodeQuery.value = key === '⌫' ? current.slice(0, -1) : current + key
  focusBarcode()
}

function clearBarcodeInput() {
  barcodeQuery.value = ''
  pending.value = ''
  focusBarcode()
}

function pendingNumber(): number {
  return Number(pending.value) || 0
}

function applyOp(op: '+' | '-' | '*' | '/') {
  if (!pending.value) consumeBarcodeAsPending()
  const n = pendingNumber()

  // Naqd/Karta maydonlari uchun: +/- qiymatni to'g'ridan-to'g'ri o'sha
  // maydonga YOZADI (to'lov summasini kiritishning eng qulay yo'li)
  if (activeTarget.value?.kind === 'mixedCash') {
    mixedCash.value = n
    mixedTouched.value = true
    pending.value = ''
    return
  }
  if (activeTarget.value?.kind === 'mixedCard') {
    mixedCard.value = n
    mixedTouched.value = true
    pending.value = ''
    return
  }

  const line = activeLine.value
  if (!line) return

  if (op === '+') {
    // Ko'proq miqdor qo'shish: pending qiymati joriy miqdorga QO'SHILADI
    line.quantity = round3(line.quantity + n)
    clampQty(line)
  } else if (op === '-') {
    // Miqdorni kamaytirish (masalan xato skanerlangan ortiqchani olib tashlash)
    line.quantity = round3(line.quantity - n)
    clampQty(line)
  } else if (op === '*') {
    // Narxni tushirib/o'zgartirib qo'yish (masalan 2000 -> 1800)
    line.price = n
  } else if (op === '/') {
    // Summa (to'langan pul) bo'yicha miqdorni (masalan kg) avto hisoblash
    onAmountInput(line, n)
  }
  pending.value = ''
  focusBarcodeSoon()
}

function applyF6() {
  if (!pending.value) consumeBarcodeAsPending()
  // Umumiy chekdan chegirma — to'g'ridan-to'g'ri so'm miqdorida
  overallDiscountValue.value = pendingNumber()
  pending.value = ''
  focusBarcodeSoon()
}

function applyF7() {
  if (!pending.value) consumeBarcodeAsPending()
  // Tanlangan mahsulotga chegirma — to'g'ridan-to'g'ri so'm miqdorida
  const line = activeLine.value
  if (!line) return
  line.discount = Math.min(Math.max(pendingNumber(), 0), grossAmount(line))
  pending.value = ''
  focusBarcodeSoon()
}

// ─────────────────────────── To'lov ───────────────────────────
const paymentOptions = [
  { title: 'Naqd', value: 'cash' },
  { title: 'Karta', value: 'card' },
  { title: 'Aralash', value: 'mixed' },
]


watch(grandTotal, val => {
  if (!mixedTouched.value) mixedCash.value = val
})

function fillAllCash() {
  mixedCash.value = grandTotal.value
  mixedCard.value = 0
  mixedTouched.value = true
}

function fillAllCard() {
  mixedCard.value = grandTotal.value
  mixedCash.value = 0
  mixedTouched.value = true
}

function autoFillCard() {
  mixedCard.value = round2(Math.max(grandTotal.value - mixedCash.value, 0))
  mixedTouched.value = true
}

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

const paymentSectionOpen = ref(false)
const paymentTab = ref<'pay' | 'debt'>('pay')

// ─────────────────────────── Mijoz ───────────────────────────
const customerSearch = ref('')
const customerLoading = ref(false)
const newCustomerInline = ref(false)
const newCustomer = reactive({ fullName: '', phone: '' })

const onCustomerSearch = useDebounceFn(async (value: string) => {
  if (!value || !isOnline.value) return
  customerLoading.value = true
  try {
    await customersStore.fetchCustomers(1, value)
  } finally {
    customerLoading.value = false
  }
}, 350)

async function createCustomer() {
  try {
    const created = await customersStore.createCustomer({
      fullName: newCustomer.fullName,
      phone: newCustomer.phone || undefined,
    })
    customersStore.customers.unshift(created)
    customerId.value = created.id
    newCustomerInline.value = false
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
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

// ─────────────────────────── Checkout ───────────────────────────
const checkingOut = ref(false)
const receiptDialog = ref(false)
const pendingDialog = ref(false)
const printerDialog = ref(false)
const printing = ref(false)
const receipt = ref<ReceiptData | null>(null)

const {
  connected: printerConnected,
  autoPrint,
  printReceipt: sendToPrinter,
  tryReconnect: reconnectPrinter,
} = usePrinter()

// Haqiqiy termoprinterga chop etish (brauzer chop etish oynasisiz)
async function runPrint(openSettingsIfMissing: boolean) {
  if (!receipt.value) return
  if (!printerConnected.value) {
    toastStore.error(
      openSettingsIfMissing ? 'Printer ulanmagan — sozlamalarni oching' : 'Chek chop etilmadi: printer ulanmagan',
    )
    if (openSettingsIfMissing) printerDialog.value = true
    return
  }
  printing.value = true
  try {
    await sendToPrinter(receipt.value)
  } catch (e: any) {
    toastStore.error(e?.message || "Chop etib bo'lmadi")
  } finally {
    printing.value = false
  }
}

function printCurrentReceipt() {
  return runPrint(true)
}

async function checkout() {
  if (!cart.value.length) return

  if (debtAmount.value > 0 && !customerId.value) {
    toastStore.error('Qarz uchun mijoz tanlanishi shart')
    paymentTab.value = 'debt'
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
      paymentType: derivedPaymentType.value,
      paidAmount: effectivePaid.value,
    }

    if (derivedPaymentType.value === 'mixed') {
      payload.payments = [
        { type: 'cash', amount: Number(mixedCash.value) || 0 },
        { type: 'card', amount: Number(mixedCard.value) || 0 },
      ].filter(p => p.amount > 0)
    }

    if (customerId.value) payload.customerId = customerId.value

    // Savat tozalanishidan OLDIN chek uchun kerakli ma'lumotlarni olib qo'yamiz
    const customerName = customersStore.customers.find(c => c.id === customerId.value)?.fullName ?? null

    if (!isOnline.value) {
      await offlineStore.queueOrder(payload)
      receipt.value = receiptFromCart({
        lines: cart.value.map(l => ({
          name: l.name,
          unit: l.unit,
          price: l.price,
          quantity: l.quantity,
          discount: lineDiscountAmount(l),
        })),
        overallDiscount: overallDiscountAmount.value,
        paidAmount: Math.min(effectivePaid.value, grandTotal.value),
        debtAmount: debtAmount.value,
        paymentType: derivedPaymentType.value,
        cashier: cashierName.value,
        customerName,
      })
      receiptDialog.value = true
      toastStore.success('Chek oflayn saqlandi')
      emptyActiveBasket()
      if (autoPrint.value) await runPrint(false)
      return
    }

    const order = await ordersStore.createOrder(payload)

    receipt.value = receiptFromOrder(order, { cashier: cashierName.value, customerName })
    receiptDialog.value = true
    toastStore.success('Chek muvaffaqiyatli yakunlandi')

    emptyActiveBasket()
    loadRecent()
    if (autoPrint.value) await runPrint(false)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik yuz berdi')
  } finally {
    checkingOut.value = false
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}

// ─────────────────────────── Hotkeys ───────────────────────────
function onKeydown(e: KeyboardEvent) {
  // Modal oyna ochiq paytda kassa tugmalari (F4/F6/F7, Esc) ishlamaydi
  if (anyDialogOpen()) return

  // Barcode, qidiruv va boshqa haqiqiy matn maydonlari fokusda bo'lsa —
  // ularning odatiy yozuv xatti-harakatiga aralashmaymiz (masalan barcode
  // qo'lda kiritilayotgan bo'lsa raqamlar o'sha yerga tushishi kerak).
  const tag = (document.activeElement as HTMLElement)?.tagName
  const isRealTextInput = tag === 'INPUT' || tag === 'TEXTAREA'

  // Fizik klaviaturadan raqam/amal kiritish: faqat biror maydon (miqdor,
  // narx, chegirma, naqd, karta) tanlangan va hech qanday matn maydoni
  // fokusda bo'lmaganda ishlaydi (chunki tugma bosilganda fokus o'sha
  // tugmaga o'tadi, matn maydoniga emas).
  if (!isRealTextInput && activeTarget.value) {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      pressKey(e.key)
      return
    }
    if (e.key === 'Backspace') {
      e.preventDefault()
      pressKey('⌫')
      return
    }
    if (e.key === '+') {
      e.preventDefault()
      applyOp('+')
      return
    }
    if (e.key === '-') {
      e.preventDefault()
      applyOp('-')
      return
    }
    if (e.key === '*') {
      e.preventDefault()
      applyOp('*')
      return
    }
    if (e.key === '/') {
      e.preventDefault()
      applyOp('/')
      return
    }
  }

  if (e.key === 'F2') {
    e.preventDefault()
    nameSearchRef.value?.focus?.()
  } else if (e.key === 'F4') {
    e.preventDefault()
    if (cart.value.length) paymentSectionOpen.value = true
  } else if (e.key === 'F6') {
    e.preventDefault()
    applyF6()
  } else if (e.key === 'F7') {
    e.preventDefault()
    applyF7()
  } else if (e.key === 'Escape') {
    // Modal Esc bilan endigina yopilgan bo'lsa — savatni tozalamaymiz
    if (Date.now() - lastDialogClosedAt < 300) return
    e.preventDefault()
    if (cart.value.length) emptyActiveBasket()
  }
}

// ─────────────────────────── Modal oynalar ───────────────────────────
let lastDialogClosedAt = 0
watch(
  [paymentSectionOpen, receiptDialog, pendingDialog, printerDialog],
  (now, before) => {
    if (before.some((was, i) => was && !now[i])) {
      lastDialogClosedAt = Date.now()
      nextTick(() => focusBarcodeSoon())
    }
  },
  { flush: 'sync' },
)

const cashInputRef = ref()
watch(paymentSectionOpen, open => {
  if (!open) return
  paymentTab.value = 'pay'
  if (!mixedTouched.value) {
    mixedCash.value = grandTotal.value
    mixedCard.value = 0
  }
  // To'lov maydoniga fokus va matnni belgilash — darhol yozish uchun
  setTimeout(() => {
    const input = cashInputRef.value?.$el?.querySelector('input')
    input?.focus()
    input?.select()
  }, 150)
})

// ─────────────────────────── Onlayn holat kuzatuvi ───────────────────────────
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
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
.pos-barcode-input {
  inline-size: 150px;

  :deep(.v-field) {
    font-size: 0.85rem;
  }

  :deep(fieldset) {
    border-width: 1px;
    border-color: rgb(var(--v-theme-primary));
  }
}

.pos-cart-line__unit {
  margin-inline-start: 3px;
  font-size: 0.7rem;
  opacity: 0.7;
}

.pos-barcode-hint {
  max-inline-size: 520px;
  line-height: 1.3;
}

.pos-cart-scroll {
  max-block-size: 360px;
  overflow-y: auto;
}

.pos-cart-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pos-cart-line {
  display: grid;
  grid-template-columns: 1.3fr auto auto auto auto auto;
  align-items: center;
  gap: 8px;
  padding-block: 6px;
  border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  &--active {
    background-color: rgba(var(--v-theme-primary), 0.06);
  }

  &__qty {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__qty-value,
  &__amount,
  &__price,
  &__discount {
    min-inline-size: 58px;
  }
}

.pos-mini-table {
  max-block-size: 180px;
  overflow-y: auto;

  tr {
    cursor: pointer;

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.06);
    }
  }
}

.pos-row--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pos-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;

  &__btn {
    min-height: 42px;
    font-size: 1rem;
  }
}

.pos-keypad-ops {
  display: flex;
  gap: 6px;

  >* {
    flex: 1;
  }
}

kbd {
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  font-family: inherit;
}
</style>
