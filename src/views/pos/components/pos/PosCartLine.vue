<script lang="ts" setup>
import type { CartLine } from '@/@core/stores/pos'
import type { TargetKind } from '@/composables/pos/usePosCart'
import { formatMoney, formatQty } from '@/utils/posFormat'

defineProps<{
  line: CartLine
  grossAmount: number
  /** Shu qator faol bo'lsa — qaysi maydon tanlangani, aks holda null */
  targetKind: TargetKind | null
}>()

const emit = defineEmits<{
  (e: 'select', kind: 'qty' | 'amount' | 'price' | 'discount'): void
  (e: 'remove'): void
}>()
</script>

<template>
  <div class="pos-cart-line" :class="{ 'pos-cart-line--active': targetKind !== null }" @click="emit('select', 'qty')">
    <div class="pos-cart-line__info">
      <div class="text-body-2 font-weight-medium">{{ line.name }}</div>
      <div class="text-caption text-medium-emphasis">
        {{ formatMoney(line.price) }} so'm / {{ line.unit }}
      </div>
    </div>

    <!-- Miqdor -->
    <div class="pos-cart-line__qty">
      <VBtn size="small" variant="tonal" :color="targetKind === 'qty' ? 'primary' : undefined"
        class="pos-cart-line__qty-value">
        {{ formatQty(line.quantity) }}
        <span class="pos-cart-line__unit">{{ line.unit }}</span>
      </VBtn>
    </div>

    <!-- Summa (÷) -->
    <VBtn size="small" variant="tonal" :color="targetKind === 'amount' ? 'primary' : undefined"
      class="pos-cart-line__amount" @click.stop="emit('select', 'amount')">
      {{ formatMoney(grossAmount) }}
    </VBtn>

    <!-- Narx (×) -->
    <VBtn size="small" variant="tonal" :color="targetKind === 'price' ? 'primary' : undefined"
      class="pos-cart-line__price" @click.stop="emit('select', 'price')">
      {{ formatMoney(line.price) }}
    </VBtn>

    <!-- Chegirma (F7) -->
    <VBtn size="small" variant="tonal" :color="targetKind === 'discount' ? 'primary' : undefined"
      class="pos-cart-line__discount" @click.stop="emit('select', 'discount')">
      {{ formatMoney(line.discount) }}
    </VBtn>

    <IconBtn size="small" @click.stop="emit('remove')">
      <VIcon icon="tabler-trash" color="error" />
    </IconBtn>
  </div>
</template>

<style lang="scss" scoped>
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

  &__unit {
    margin-inline-start: 3px;
    font-size: 0.7rem;
    opacity: 0.7;
  }
}
</style>
