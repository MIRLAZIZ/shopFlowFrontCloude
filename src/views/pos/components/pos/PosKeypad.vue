<script lang="ts" setup>
defineProps<{
  activeTargetLabel: string
  hasActiveLine: boolean
}>()

const autoPrint = defineModel<boolean>('autoPrint', { required: true })

const emit = defineEmits<{
  (e: 'press-key', key: string): void
  (e: 'op', op: '+' | '-' | '*' | '/'): void
  (e: 'f6'): void
  (e: 'f7'): void
  (e: 'clear'): void
  (e: 'enter'): void
  (e: 'quick-qty', n: number): void
  (e: 'reset-discounts'): void
}>()

const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '⌫']
const quickQtys = [1, 5, 10, 20, 50]
</script>

<template>
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
            @click="emit('reset-discounts')">
            <VIcon icon="tabler-discount-off" size="18" />
          </VBtn>
        </div>
        <span class="text-caption text-medium-emphasis text-end">{{ activeTargetLabel }}</span>
      </div>

      <div class="pos-keypad">
        <VBtn v-for="key in keys" :key="key" variant="tonal" class="pos-keypad__btn" @click="emit('press-key', key)">
          {{ key }}
        </VBtn>
      </div>

      <div class="pos-keypad-ops mt-2">
        <VBtn variant="tonal" color="success" :disabled="!hasActiveLine" @click="emit('op', '+')">+</VBtn>
        <VBtn variant="tonal" color="error" :disabled="!hasActiveLine" @click="emit('op', '-')">−</VBtn>
        <VBtn variant="tonal" :disabled="!hasActiveLine" @click="emit('op', '*')">×</VBtn>
        <VBtn variant="tonal" :disabled="!hasActiveLine" @click="emit('op', '/')">÷</VBtn>
      </div>

      <div class="pos-keypad-ops mt-2">
        <VBtn variant="tonal" color="warning" class="flex-grow-1" @click="emit('f6')">
          F6 · Umumiy chegirma
        </VBtn>
        <VBtn variant="tonal" color="warning" class="flex-grow-1" :disabled="!hasActiveLine" @click="emit('f7')">
          F7 · Mahsulot chegirma
        </VBtn>
      </div>

      <div class="d-flex gap-2 mt-2">
        <VBtn variant="tonal" color="error" class="flex-grow-1" @click="emit('clear')">C</VBtn>
        <VBtn variant="tonal" color="primary" class="flex-grow-1" @click="emit('enter')">Enter ↵</VBtn>
      </div>

      <VDivider class="my-3" />

      <div class="text-caption text-medium-emphasis mb-2">Tezkor miqdor (tanlangan qatorga)</div>
      <div class="d-flex gap-1 flex-wrap">
        <VBtn v-for="n in quickQtys" :key="n" size="small" variant="tonal" :disabled="!hasActiveLine"
          @click="emit('quick-qty', n)">
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
</template>

<style lang="scss" scoped>
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
