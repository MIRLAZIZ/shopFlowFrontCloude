<script lang="ts" setup>
import { Order } from '@/interface/order.interface'
import { formatDate, formatMoney, paymentLabel } from '@/utils/posFormat'

defineProps<{ orders: Order[] }>()
</script>

<template>
  <VCard title="So'nggi cheklar" class="mt-6">
    <VTable density="comfortable">
      <thead>
        <tr>
          <th>№</th>
          <th>Vaqt</th>
          <th>To'lov turi</th>
          <th class="text-end">Summa</th>
          <th>Holati</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in orders" :key="o.id">
          <td>#{{ o.id }}</td>
          <td>{{ formatDate(o.createdAt) }}</td>
          <td>{{ paymentLabel(o.paymentType) }}</td>
          <td class="text-end">{{ formatMoney(o.total) }} so'm</td>
          <td>
            <VChip :color="o.status === 'completed' ? 'success' : 'error'" size="small">
              {{ o.status === 'completed' ? 'Yakunlangan' : 'Bekor qilingan' }}
            </VChip>
          </td>
        </tr>
        <tr v-if="!orders.length">
          <td colspan="5" class="text-center text-medium-emphasis py-4">Cheklar yo'q</td>
        </tr>
      </tbody>
    </VTable>
  </VCard>
</template>
