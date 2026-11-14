<script lang="ts" setup>
import { useOfflineStore } from '@/@core/stores/offline'

defineProps<{
  isOnline: boolean
  cashierName: string
  printerConnected: boolean
}>()

const emit = defineEmits<{
  (e: 'open-pending'): void
  (e: 'open-printer'): void
}>()

const offlineStore = useOfflineStore()
</script>

<template>
  <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-3">
    <div class="d-flex align-center gap-3">
      <VChip :color="isOnline ? 'success' : 'error'" size="small" variant="flat">
        <VIcon start :icon="isOnline ? 'tabler-wifi' : 'tabler-wifi-off'" size="14" />
        {{ isOnline ? 'Onlayn' : 'Oflayn' }}
      </VChip>

      <VChip v-if="offlineStore.pendingOrders.length" :color="offlineStore.failedCount ? 'error' : 'warning'"
        size="small" variant="tonal" class="cursor-pointer" @click="emit('open-pending')">
        <VIcon start icon="tabler-clock-exclamation" size="14" />
        {{ offlineStore.pendingCount }} kutilmoqda
        <span v-if="offlineStore.failedCount">, {{ offlineStore.failedCount }} xato</span>
      </VChip>

      <VChip :color="printerConnected ? 'success' : undefined" size="small"
        :variant="printerConnected ? 'flat' : 'tonal'" class="cursor-pointer" @click="emit('open-printer')">
        <VIcon start :icon="printerConnected ? 'tabler-printer' : 'tabler-printer-off'" size="14" />
        {{ printerConnected ? 'Printer ulangan' : 'Printer ulanmagan' }}
      </VChip>

      <span v-if="cashierName" class="text-medium-emphasis text-body-2">
        Kassir: <strong>{{ cashierName }}</strong>
      </span>
    </div>
  </div>
</template>
