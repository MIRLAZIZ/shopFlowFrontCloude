<script lang="ts" setup>
import { ref } from 'vue'
import type { Basket } from '@/@core/stores/pos'

defineProps<{ baskets: Basket[] }>()

const barcodeQuery = defineModel<string>({ default: '' })
const activeBasketId = defineModel<number>('activeBasketId')

const emit = defineEmits<{
  (e: 'keydown', event: KeyboardEvent): void
  (e: 'add-basket'): void
  (e: 'close-basket', id: number): void
}>()

const inputRef = ref()
defineExpose({ focus: () => inputRef.value?.focus?.() })
</script>

<template>
  <div class="d-flex align-center gap-3 mb-3 flex-wrap">
    <VTextField ref="inputRef" v-model="barcodeQuery" placeholder="Shtrix kod..."
      prepend-inner-icon="tabler-barcode" density="compact" variant="outlined" class="pos-barcode-input"
      @keydown="emit('keydown', $event)" />
    <span class="text-caption text-medium-emphasis pos-barcode-hint">
      Raqam yozib: <kbd>+</kbd> qo'shish · <kbd>−</kbd> ayirish · <kbd>×</kbd> narx · <kbd>÷</kbd> summa→miqdor ·
      <kbd>F6</kbd> umumiy / <kbd>F7</kbd> mahsulot chegirma
    </span>

    <VChip v-for="b in baskets" :key="b.id" :color="b.id === activeBasketId ? 'primary' : undefined"
      :variant="b.id === activeBasketId ? 'flat' : 'tonal'" class="cursor-pointer" @click="activeBasketId = b.id">
      {{ b.label }}
      <VChip v-if="b.cart.length" size="x-small" class="ml-1">{{ b.cart.length }}</VChip>
      <VIcon v-if="baskets.length > 1" icon="tabler-x" size="14" class="ml-1" @click.stop="emit('close-basket', b.id)" />
    </VChip>
    <VBtn icon size="small" variant="tonal" @click="emit('add-basket')">
      <VIcon icon="tabler-plus" />
    </VBtn>
  </div>
</template>

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

.pos-barcode-hint {
  max-inline-size: 520px;
  line-height: 1.3;
}

kbd {
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  font-family: inherit;
}
</style>
