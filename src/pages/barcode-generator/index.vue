<template>
  <div>
    <VCard title="Vaznli shtrix-kod yaratish" class="mb-6">
      <VCardText>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Shtrix-kodi yo'q yoki vazn bo'yicha sotiladigan mahsulotlar (piyoz, go'sht, un va h.k.)
          uchun qadoq yorlig'i yarating. Masalan piyoz 5 kg qilib qadoqlansa — shu yorliqni
          chop etib yopishtirasiz, kassada skanerlanganda tizim avtomatik 5 kg deb tushunadi.
        </p>

        <VRow>
          <VCol cols="12" sm="6">
            <VAutocomplete
              v-model="selectedProductId"
              v-model:search="productSearch"
              :items="searchResults"
              item-title="name"
              item-value="id"
              label="Mahsulot"
              placeholder="Qidirish..."
              :loading="searching"
              no-filter
              clearable
              @update:search="onSearch"
              @update:model-value="onProductSelect"
            >
              <template #item="{ props, item }">
                <VListItem
                  v-bind="props"
                  :title="item.raw.name"
                  :subtitle="`${formatMoney(item.raw.selling_price)} so'm / ${unitLabel(item.raw)}`"
                />
              </template>
            </VAutocomplete>
          </VCol>

          <VCol cols="12" sm="3">
            <AppTextField v-model.number="weightKg" type="number" label="Vazn (kg)" step="0.001" />
          </VCol>

          <VCol cols="12" sm="3">
            <AppTextField v-model.number="copies" type="number" label="Nusxalar soni" min="1" max="100" />
          </VCol>
        </VRow>

        <div class="d-flex gap-1 flex-wrap mb-4">
          <VBtn
            v-for="w in quickWeights"
            :key="w"
            size="small"
            variant="tonal"
            @click="weightKg = w"
          >
            {{ w }} kg
          </VBtn>
        </div>

        <div v-if="selectedProduct" class="d-flex justify-space-between align-center mb-4 pa-3 bg-grey-50 rounded">
          <div>
            <div class="font-weight-medium">{{ selectedProduct.name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ formatMoney(selectedProduct.selling_price) }} so'm / {{ unitLabel(selectedProduct) }}
            </div>
          </div>
          <div class="text-h6">
            {{ formatMoney((selectedProduct.selling_price || 0) * weightKg) }} so'm
          </div>
        </div>

        <VBtn
          color="primary"
          prepend-icon="tabler-barcode"
          :disabled="!selectedProduct || !weightKg || weightKg <= 0"
          @click="generateLabels"
        >
          Yorliq yaratish
        </VBtn>
      </VCardText>
    </VCard>

    <!-- ═══════════════ YORLIQLAR ═══════════════ -->
    <VCard v-if="labels.length" title="Yorliqlar">
      <template #append>
        <VBtn variant="tonal" prepend-icon="tabler-printer" @click="printLabels">
          Chop etish
        </VBtn>
      </template>

      <VCardText>
        <div id="barcode-labels" class="barcode-labels-grid">
          <div v-for="(label, idx) in labels" :key="idx" class="barcode-label">
            <div class="barcode-label__name">{{ label.productName }}</div>
            <div class="barcode-label__meta">
              <span>{{ label.weightKg }} kg</span>
              <span class="font-weight-bold">{{ formatMoney(label.price) }} so'm</span>
            </div>
            <svg :ref="el => setBarcodeRef(el as SVGElement, idx)" class="barcode-label__svg" />
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<script lang="ts" setup>
import { useProductsStore } from '@/@core/stores/products'
import { useToastStore } from '@/@core/stores/toast.store'
import { Product } from '@/interface/products.interface'
import { generateWeightBarcode } from '@/utils/weightBarcode'
import { useDebounceFn } from '@vueuse/core'
import JsBarcode from 'jsbarcode'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const productsStore = useProductsStore()
const toastStore = useToastStore()

const productSearch = ref('')
const searchResults = ref<Product[]>([])
const searching = ref(false)
const selectedProductId = ref<number | null>(null)
const selectedProduct = ref<Product | null>(null)

const weightKg = ref(1)
const copies = ref(1)
const quickWeights = [0.5, 1, 2, 5, 10]

const onSearch = useDebounceFn(async (value: string) => {
  if (!value?.trim()) {
    searchResults.value = []
    return
  }
  searching.value = true
  try {
    const res: any = await productsStore.searchProduct({ name: value.trim() })
    searchResults.value = res?.data ?? []
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}, 300)

function onProductSelect(id: number | null) {
  selectedProduct.value = searchResults.value.find(p => p.id === id) ?? null
}

function unitLabel(product: Product) {
  const unit = product.unit
  if (unit && typeof unit === 'object') return unit.name
  return 'dona'
}

interface BarcodeLabel {
  code: string
  productName: string
  weightKg: number
  price: number
}

const labels = ref<BarcodeLabel[]>([])
const svgRefs = new Map<number, SVGElement>()

function setBarcodeRef(el: SVGElement | null, idx: number) {
  if (el) svgRefs.set(idx, el)
}

function generateLabels() {
  if (!selectedProduct.value) return
  try {
    const code = generateWeightBarcode(selectedProduct.value.id, weightKg.value * 1000)
    const price = Math.round((selectedProduct.value.selling_price || 0) * weightKg.value)

    labels.value = Array.from({ length: Math.max(1, copies.value) }, () => ({
      code,
      productName: selectedProduct.value!.name,
      weightKg: weightKg.value,
      price,
    }))

    nextTick(() => renderBarcodes())
  } catch (error: any) {
    toastStore.error(error.message || 'Xatolik')
  }
}

function renderBarcodes() {
  labels.value.forEach((label, idx) => {
    const svg = svgRefs.get(idx)
    if (!svg) return
    JsBarcode(svg, label.code, {
      format: 'EAN13',
      width: 1.6,
      height: 50,
      fontSize: 12,
      margin: 4,
    })
  })
}

function printLabels() {
  nextTick(() => window.print())
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}
</script>

<style lang="scss" scoped>
.barcode-labels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.barcode-label {
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  padding: 8px;
  text-align: center;

  &__name {
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    margin-block: 2px;
  }

  &__svg {
    inline-size: 100%;
  }
}
</style>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #barcode-labels, #barcode-labels * {
    visibility: visible;
  }
  #barcode-labels {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    inline-size: 100%;
  }
}
</style>
