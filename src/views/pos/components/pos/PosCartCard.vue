<script lang="ts" setup>
import type { CartLine } from '@/@core/stores/pos'
import type { NumericTarget } from '@/composables/pos/usePosCart'
import { formatMoney } from '@/utils/posFormat'
import PosCartLine from './PosCartLine.vue'

defineProps<{
  title: string
  cart: CartLine[]
  activeTarget: NumericTarget | null
  grossAmount: (line: CartLine) => number
  subtotal: number
  lineDiscountsTotal: number
  overallDiscountAmount: number
  grandTotal: number
}>()

const emit = defineEmits<{
  (e: 'clear'): void
  (e: 'pay'): void
  (e: 'select', line: CartLine, kind: 'qty' | 'amount' | 'price' | 'discount'): void
  (e: 'remove', productId: number): void
}>()
</script>

<template>
  <VCard :title="title" class="h-100">
    <template #append>
      <VBtn v-if="cart.length" size="small" variant="text" color="error" @click="emit('clear')">
        Tozalash
      </VBtn>
    </template>

    <VCardText>
      <div class="pos-cart-scroll">
        <p v-if="!cart.length" class="text-medium-emphasis text-center py-8">
          Savat bo'sh — pastdan mahsulot qidiring yoki barcode skanerlang
        </p>

        <div v-else class="pos-cart-lines">
          <PosCartLine v-for="line in cart" :key="line.productId" :line="line"
            :gross-amount="grossAmount(line)"
            :target-kind="activeTarget?.lineId === line.productId ? activeTarget.kind : null"
            @select="kind => emit('select', line, kind)" @remove="emit('remove', line.productId)" />
        </div>
      </div>

      <VDivider class="my-3" />

      <!-- Qidiruv (PosProductSearch) shu yerga joylanadi -->
      <slot name="search" />

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

      <VBtn block size="large" color="primary" :disabled="!cart.length" @click="emit('pay')">
        To'lov (F4)
      </VBtn>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.pos-cart-scroll {
  max-block-size: 360px;
  overflow-y: auto;
}

.pos-cart-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
