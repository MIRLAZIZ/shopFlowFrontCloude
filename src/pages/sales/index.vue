<template>
  <div>
    <VRow>
      <!-- ═══════════════ 1) QIDIRUV / SKANER ═══════════════ -->
      <VCol cols="12" md="5">
        <VCard title="Mahsulot qidirish" class="h-100">
          <VCardText>
            <VTextField
              ref="searchInputRef"
              v-model="query"
              placeholder="Barcode skanerlang yoki nom/tezkor kod yozing..."
              prepend-inner-icon="tabler-barcode"
              autofocus
              clearable
              density="comfortable"
              @keydown.enter="onEnter"
              @update:model-value="onQueryChange"
            />

            <VProgressLinear v-if="searching" indeterminate color="primary" class="mt-1" />

            <VList v-if="results.length" class="mt-2" lines="two">
              <VListItem
                v-for="p in results"
                :key="p.id"
                :title="p.name"
                :subtitle="`${formatMoney((p as any).selling_price)} so'm  •  qoldiq: ${p.quantity}`"
                :disabled="p.quantity <= 0"
                @click="addToCart(p)"
              >
                <template #prepend>
                  <VAvatar color="primary" variant="tonal">
                    <VIcon icon="tabler-package" />
                  </VAvatar>
                </template>
                <template #append>
                  <VChip v-if="p.quantity <= 0" color="error" size="small">Tugagan</VChip>
                  <VBtn v-else icon size="small" variant="text" color="success">
                    <VIcon icon="tabler-plus" />
                  </VBtn>
                </template>
              </VListItem>
            </VList>

            <p v-else-if="query && !searching" class="text-medium-emphasis mt-4">
              Hech narsa topilmadi
            </p>
          </VCardText>
        </VCard>
      </VCol>

      <!-- ═══════════════ 2) SAVAT (CHEK) ═══════════════ -->
      <VCol cols="12" md="4">
        <VCard title="Chek" class="h-100">
          <template #append>
            <VChip v-if="cart.length" color="primary" variant="tonal">
              {{ cart.length }} mahsulot
            </VChip>
          </template>

          <VCardText>
            <p v-if="!cart.length" class="text-medium-emphasis text-center py-10">
              Savat bo'sh — chapdan mahsulot tanlang
            </p>

            <VTable v-else density="comfortable">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th style="width: 96px">Soni</th>
                  <th class="text-end">Summa</th>
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
                    <VTextField
                      v-model.number="line.quantity"
                      type="number"
                      density="compact"
                      hide-details
                      min="1"
                      :max="line.availableQuantity"
                      @update:model-value="clampQty(line)"
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
          </VCardText>
        </VCard>
      </VCol>

      <!-- ═══════════════ 3) TO'LOV ═══════════════ -->
      <VCol cols="12" md="3">
        <VCard title="To'lov" class="h-100">
          <VCardText>
            <div class="d-flex justify-space-between mb-1">
              <span class="text-medium-emphasis">Jami:</span>
              <span>{{ formatMoney(subtotal) }} so'm</span>
            </div>
            <div class="d-flex justify-space-between mb-3">
              <span class="text-medium-emphasis">Yakuniy summa:</span>
              <span class="text-h6">{{ formatMoney(grandTotal) }} so'm</span>
            </div>

            <VDivider class="mb-4" />

            <AppSelect
              v-model="paymentType"
              :items="paymentOptions"
              item-title="title"
              item-value="value"
              label="To'lov turi"
              class="mb-3"
            />

            <template v-if="paymentType !== 'mixed'">
              <AppTextField
                v-model.number="paidAmount"
                type="number"
                label="To'langan summa"
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
              :disabled="!cart.length || checkingOut"
              :loading="checkingOut"
              @click="checkout"
            >
              To'lash
            </VBtn>
          </VCardText>
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
        <VCardText class="d-flex justify-end">
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
import { useDebounceFn } from '@vueuse/core'

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
  discount: number
  availableQuantity: number
}

const productsStore = useProductsStore()
const ordersStore = useOrdersStore()
const customersStore = useCustomersStore()
const toastStore = useToastStore()

// ─────────────────────────── Qidiruv ───────────────────────────
const searchInputRef = ref()
const query = ref('')
const results = ref<Product[]>([])
const searching = ref(false)

function focusSearch() {
  nextTick(() => searchInputRef.value?.focus?.())
}

const runSearch = useDebounceFn(async (value: string) => {
  if (!value?.trim()) {
    results.value = []
    return
  }
  searching.value = true
  try {
    const res: any = await productsStore.searchProduct({ name: value.trim() })
    results.value = res?.data ?? []
  } catch {
    results.value = []
  } finally {
    searching.value = false
  }
}, 350)

function onQueryChange(value: string) {
  runSearch(value)
}

async function onEnter() {
  const value = query.value?.trim()
  if (!value) return

  // 🔫 Barcode skaner: aniq moslikni birinchi urinamiz
  try {
    const byBarcode: any = await productsStore.searchProduct({ barcode: value })
    if (byBarcode?.data?.length === 1) {
      addToCart(byBarcode.data[0])
      return
    }
    const byQuick: any = await productsStore.searchProduct({ quickCode: value })
    if (byQuick?.data?.length === 1) {
      addToCart(byQuick.data[0])
      return
    }
  } catch {
    // aniq moslik topilmadi — pastdagi umumiy natijaga o'tamiz
  }

  if (results.value.length === 1) {
    addToCart(results.value[0])
  } else if (!results.value.length) {
    toastStore.error("Mahsulot topilmadi")
  }
}

// ─────────────────────────── Savat ───────────────────────────
const cart = ref<CartLine[]>([])

function addToCart(product: Product) {
  const availableQty = (product as any).quantity ?? 0
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
      price: (product as any).selling_price,
      quantity: 1,
      discount: 0,
      availableQuantity: availableQty,
    })
  }

  query.value = ''
  results.value = []
  focusSearch()
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

function lineTotal(line: CartLine) {
  return line.price * line.quantity - line.discount
}

const subtotal = computed(() =>
  cart.value.reduce((sum, l) => sum + l.price * l.quantity, 0),
)
const totalDiscount = computed(() => cart.value.reduce((sum, l) => sum + l.discount, 0))
const grandTotal = computed(() => Math.max(subtotal.value - totalDiscount.value, 0))

// ─────────────────────────── To'lov ───────────────────────────
const paymentOptions = [
  { title: 'Naqd', value: 'cash' },
  { title: 'Karta', value: 'card' },
  { title: "O'tkazma", value: 'transfer' },
  { title: 'Aralash', value: 'mixed' },
]

const paymentType = ref('cash')
const paidAmount = ref(0)
const mixedCash = ref(0)
const mixedCard = ref(0)

// To'liq to'lov summasi doim chek summasiga tenglashtirib boriladi,
// kassir kamroq kiritsa — avtomatik qarz hisoblanadi
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
    const payload: any = {
      items: cart.value.map(l => ({
        product_id: l.productId,
        quantity: l.quantity,
        discount: l.discount || undefined,
      })),
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

    // Savatni tozalash
    cart.value = []
    paymentType.value = 'cash'
    paidAmount.value = 0
    mixedCash.value = 0
    mixedCard.value = 0
    customerId.value = null
    focusSearch()
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik yuz berdi')
  } finally {
    checkingOut.value = false
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}

onMounted(focusSearch)
</script>

<style lang="scss" scoped></style>
