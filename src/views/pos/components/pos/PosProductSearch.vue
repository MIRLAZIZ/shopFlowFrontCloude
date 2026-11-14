<script lang="ts" setup>
import { useOfflineStore } from '@/@core/stores/offline'
import { useProductsStore } from '@/@core/stores/products'
import { Product } from '@/interface/products.interface'
import { useDebounceFn } from '@vueuse/core'
import { ref } from 'vue'
// import { formatMoney } from '@/utils/posFormat'

const props = defineProps<{ isOnline: boolean }>()
const emit = defineEmits<{
  (e: 'pick', product: Product): void
  (e: 'blur'): void
}>()

const productsStore = useProductsStore()
const offlineStore = useOfflineStore()

const inputRef = ref()
const nameQuery = ref('')
const nameResults = ref<Product[]>([])

defineExpose({ focus: () => inputRef.value?.focus?.() })

const runNameSearch = useDebounceFn(async (value: string) => {
  if (!value?.trim()) {
    nameResults.value = []
    return
  }
  if (!props.isOnline) {
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

function pick(p: Product) {
  emit('pick', p)
  nameQuery.value = ''
  nameResults.value = []
}

function onEnter() {
  if (nameResults.value.length === 1) pick(nameResults.value[0])
}
</script>

<template>
  <div>
    <VTextField ref="inputRef" v-model="nameQuery" placeholder="Mahsulot nomi yoki qisqa kod bilan qidirish..."
      prepend-inner-icon="tabler-search" density="compact" clearable class="mb-2" @update:model-value="runNameSearch"
      @keydown.enter="onEnter" @blur="emit('blur')" />

    <VTable v-if="nameQuery.trim() && nameResults.length" density="compact" class="pos-mini-table mb-2">
      <tbody>
        <tr v-for="p in nameResults" :key="p.id" :class="{ 'pos-row--disabled': p.quantity <= 0 }" @click="pick(p)">
          <td class="text-caption">{{ p.barcode || p.quick_code || '-' }}</td>
          <td class="text-caption">{{ p.name }}</td>
          <!-- <td class="text-end text-caption">{{ formatMoney(p.selling_price) }}</td> -->
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
  </div>
</template>

<style lang="scss" scoped>
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
</style>
