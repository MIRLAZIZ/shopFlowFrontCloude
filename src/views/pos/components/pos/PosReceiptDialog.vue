<script lang="ts" setup>
import ReceiptPreview from '@/components/ReceiptPreview.vue'
import type { ReceiptData } from '@/utils/receipt'

defineProps<{
  receipt: ReceiptData | null
  printing: boolean
}>()
const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  (e: 'open-printer'): void
  (e: 'print'): void
}>()
</script>

<template>
  <VDialog v-model="open" max-width="400" scrollable>
    <VCard>
      <VCardText class="pb-0">
        <ReceiptPreview :receipt="receipt" />
      </VCardText>
      <VCardText class="d-flex justify-end gap-2 flex-wrap">
        <VBtn variant="text" prepend-icon="tabler-settings" @click="emit('open-printer')">
          Printer
        </VBtn>
        <VBtn variant="tonal" prepend-icon="tabler-printer" :loading="printing" @click="emit('print')">
          Chek chiqarish
        </VBtn>
        <VBtn color="primary" @click="open = false">Yopish</VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
