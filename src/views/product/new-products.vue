<script setup lang="ts">
import { computed, ref } from 'vue'

interface BatchItem {
  id: string
  product_id: number | null
  quantity: number | null
  purchase_price: number | null
  selling_price: number | null
  has_delivery: boolean
  delivery_mode: 'auto' | 'manual'
  manual_percent: number | null
}

const MOCK_PRODUCTS = [
  { id: 1, title: 'Mahsulot A', value: 1 },
  { id: 2, title: 'Mahsulot B', value: 2 },
  { id: 3, title: 'Mahsulot C', value: 3 },
  { id: 4, title: 'Mahsulot D', value: 4 },
]

const supplier = ref('')
const date = ref(new Date().toISOString().split('T')[0])
const delivery_cost = ref<number | null>(null)

const genId = () => Math.random().toString(36).slice(2, 9)

const items = ref<BatchItem[]>([
  {
    id: genId(),
    product_id: null,
    quantity: null,
    purchase_price: null,
    selling_price: null,
    has_delivery: true,
    delivery_mode: 'auto',
    manual_percent: null,
  },
])

const addItem = () => {
  items.value.push({
    id: genId(),
    product_id: null,
    quantity: null,
    purchase_price: null,
    selling_price: null,
    has_delivery: true,
    delivery_mode: 'auto',
    manual_percent: null,
  })
}

const removeItem = (id: string) => {
  if (items.value.length > 1)
    items.value = items.value.filter(i => i.id !== id)
}

// Hisoblash logikasi
const calculated = computed(() => {
  const dc = Number(delivery_cost.value || 0)

  const deliveryItems = items.value.filter(i => i.has_delivery)
  const manualItems = deliveryItems.filter(i => i.delivery_mode === 'manual')
  const autoItems = deliveryItems.filter(i => i.delivery_mode === 'auto')

  const usedPercent = manualItems.reduce((s, i) => s + Number(i.manual_percent || 0), 0)
  const remainingPercent = 100 - usedPercent

  const totalAutoPrice = autoItems.reduce(
    (s, i) => s + Number(i.quantity || 0) * Number(i.purchase_price || 0), 0,
  )

  return items.value.map((item) => {
    let percent = 0

    if (item.has_delivery) {
      if (item.delivery_mode === 'manual') {
        percent = Number(item.manual_percent || 0)
      }
      else {
        const itemPrice = Number(item.quantity || 0) * Number(item.purchase_price || 0)
        percent = totalAutoPrice > 0 ? (itemPrice / totalAutoPrice) * remainingPercent : 0
      }
    }

    const deliveryTotal = (percent / 100) * dc
    const qty = Number(item.quantity || 0)
    const deliveryPerUnit = qty > 0 ? deliveryTotal / qty : 0
    const costPrice = Number(item.purchase_price || 0) + deliveryPerUnit

    return {
      id: item.id,
      percent: percent.toFixed(1),
      deliveryPerUnit,
      costPrice,
    }
  })
})

const totalManualPercent = computed(() =>
  items.value
    .filter(i => i.has_delivery && i.delivery_mode === 'manual')
    .reduce((s, i) => s + Number(i.manual_percent || 0), 0),
)

const isPercentValid = computed(() => totalManualPercent.value <= 100)

const fmt = (n: number) => n.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })

const handleSave = () => {
  // emit yoki API call
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 font-weight-medium">
          Yangi Partiya qo'shish
        </h4>
        <span class="text-medium-emphasis">Mahsulotlar narx tarixi — batch kiritish</span>
      </div>

      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn variant="tonal" color="secondary">
          Bekor qilish
        </VBtn>
        <VBtn :disabled="!isPercentValid" @click="handleSave">
          Saqlash
        </VBtn>
      </div>
    </div>

    <VRow>
      <!-- Chap ustun -->
      <VCol cols="12" md="8">

        <!-- Asosiy ma'lumotlar -->
        <VCard class="mb-6" title="Partiya ma'lumotlari">
          <VCardText>
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField v-model="supplier" label="Yetkazuvchi" placeholder="Yetkazuvchi nomi" />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField v-model="date" label="Sana" type="date" />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Mahsulotlar jadvali -->
        <VCard title="Mahsulotlar">
          <VCardText>

            <!-- Har bir mahsulot qatori -->
            <div v-for="(item, index) in items" :key="item.id" class="mb-4">
              <div class="d-flex align-center gap-2 mb-2">
                <span class="text-caption text-medium-emphasis font-weight-bold">
                  #{{ index + 1 }}
                </span>
                <VDivider />
                <VBtn icon="tabler-trash" variant="text" color="error" size="small" :disabled="items.length === 1"
                  @click="removeItem(item.id)" />
              </div>

              <VRow dense>
                <!-- Mahsulot tanlash -->
                <VCol cols="12" md="4">
                  <AppSelect v-model="item.product_id" :items="MOCK_PRODUCTS" label="Mahsulot" placeholder="Tanlang" />
                </VCol>

                <!-- Miqdor -->
                <VCol cols="6" md="2">
                  <AppTextField v-model.number="item.quantity" label="Miqdor" placeholder="0" type="number" />
                </VCol>

                <!-- Xarid narxi -->
                <VCol cols="6" md="3">
                  <AppTextField v-model.number="item.purchase_price" label="Xarid narxi" placeholder="0"
                    type="number" />
                </VCol>

                <!-- Sotuv narxi -->
                <VCol cols="6" md="3">
                  <AppTextField v-model.number="item.selling_price" label="Sotuv narxi" placeholder="0" type="number" />
                </VCol>

                <!-- Delivery sozlamalari -->
                <VCol cols="12">
                  <div class="d-flex align-center flex-wrap gap-4 ps-1">

                    <!-- Delivery bor/yo'q -->
                    <VCheckbox v-model="item.has_delivery" label="Yetkazib kelish bor" density="compact" hide-details />

                    <!-- Delivery bo'lsa — Auto/Manual tanlash -->
                    <template v-if="item.has_delivery">
                      <VDivider vertical class="mx-2" />

                      <VRadioGroup v-model="item.delivery_mode" inline density="compact" hide-details>
                        <VRadio label="Auto (narx bo'yicha)" value="auto" />
                        <VRadio label="Qo'lda (%)" value="manual" />
                      </VRadioGroup>

                      <!-- Manual % input -->
                      <AppTextField v-if="item.delivery_mode === 'manual'" v-model.number="item.manual_percent"
                        placeholder="0" type="number" density="compact" style="max-width: 100px" suffix="%"
                        hide-details />
                    </template>

                    <!-- Hisoblangan natija -->
                    <VSpacer />
                    <div class="text-caption text-medium-emphasis text-end">
                      <div>
                        Ulush:
                        <strong class="text-primary">
                          {{calculated.find(c => c.id === item.id)?.percent}}%
                        </strong>
                      </div>
                      <div>
                        Tannarx:
                        <strong class="text-success">
                          {{fmt(calculated.find(c => c.id === item.id)?.costPrice ?? 0)}} so'm
                        </strong>
                      </div>
                    </div>
                  </div>
                </VCol>
              </VRow>
            </div>

            <!-- Yangi qator qo'shish -->
            <VBtn class="mt-2" variant="tonal" prepend-icon="tabler-plus" @click="addItem">
              Mahsulot qo'shish
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- O'ng ustun -->
      <VCol cols="12" md="4">

        <!-- Yetkazib kelish narxi -->
        <VCard class="mb-6" title="Yetkazib kelish">
          <VCardText>
            <AppTextField v-model.number="delivery_cost" label="Jami yetkazib kelish narxi" placeholder="0"
              type="number" suffix="so'm" class="mb-4" />

            <!-- Manual % ogohlantirish -->
            <VAlert v-if="!isPercentValid" type="error" variant="tonal" density="compact" class="mb-4">
              Qo'lda kiritilgan % lar jami {{ totalManualPercent }}% — 100% dan oshib ketdi!
            </VAlert>

            <VAlert v-else-if="totalManualPercent > 0" type="info" variant="tonal" density="compact">
              Qo'lda: <strong>{{ totalManualPercent }}%</strong> |
              Auto uchun qoldi: <strong>{{ 100 - totalManualPercent }}%</strong>
            </VAlert>
          </VCardText>
        </VCard>

        <!-- Xulosa -->
        <VCard title="Xulosa">
          <VCardText>
            <div class="d-flex flex-column gap-y-3">
              <div v-for="(item, index) in items" :key="item.id" class="d-flex justify-space-between align-center">
                <span class="text-sm text-medium-emphasis">
                  Mahsulot #{{ index + 1 }}
                </span>
                <div class="text-end">
                  <div class="text-sm font-weight-medium">
                    {{ fmt(calculated[index]?.costPrice ?? 0) }} so'm
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    delivery: +{{ fmt(calculated[index]?.deliveryPerUnit ?? 0) }}
                  </div>
                </div>
              </div>

              <VDivider />

              <div class="d-flex justify-space-between">
                <span class="font-weight-medium">Jami delivery:</span>
                <span class="font-weight-bold text-primary">
                  {{ fmt(Number(delivery_cost || 0)) }} so'm
                </span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
