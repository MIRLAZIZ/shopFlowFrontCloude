<script lang="ts" setup>
import { useOfflineStore } from '@/@core/stores/offline'
import { formatDate, formatMoney } from '@/utils/posFormat'

defineProps<{ isOnline: boolean }>()
const open = defineModel<boolean>({ required: true })

const offlineStore = useOfflineStore()
</script>

<template>
  <VDialog v-model="open" max-width="480">
    <VCard title="Kutilayotgan cheklar">
      <VCardText>
        <p v-if="!offlineStore.pendingOrders.length" class="text-medium-emphasis">
          Kutilayotgan chek yo'q
        </p>
        <div v-for="o in offlineStore.pendingOrders" :key="o.localId"
          class="d-flex justify-space-between align-center py-2 border-b">
          <div>
            <div class="text-body-2">{{ formatMoney(o.payload?.paidAmount ?? 0) }} so'm</div>
            <div class="text-caption text-medium-emphasis">
              {{ formatDate(o.createdAt) }}
              <VChip :color="o.status === 'failed' ? 'error' : 'warning'" size="x-small" class="ml-1">
                {{ o.status === 'failed' ? 'Xato' : 'Kutilmoqda' }}
              </VChip>
            </div>
            <div v-if="o.errorMessage" class="text-caption text-error">{{ o.errorMessage }}</div>
          </div>
          <div class="d-flex gap-1">
            <VBtn v-if="o.status === 'failed'" size="x-small" variant="tonal" color="primary" :disabled="!isOnline"
              @click="offlineStore.retryOne(o.localId)">
              Qayta urinish
            </VBtn>
            <VBtn size="x-small" variant="text" color="error" @click="offlineStore.discardOne(o.localId)">
              O'chirish
            </VBtn>
          </div>
        </div>
      </VCardText>
      <VCardText class="d-flex justify-end">
        <VBtn variant="tonal" :disabled="!isOnline || offlineStore.syncing" :loading="offlineStore.syncing"
          @click="offlineStore.syncPending()">
          Hammasini sinxronlash
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
