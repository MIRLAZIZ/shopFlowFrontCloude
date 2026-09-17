<template>
  <div>
    <VCard title="Qarzdorlar" class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppSelect
              v-model="statusFilter"
              placeholder="Holati"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              clearable
              clear-icon="tabler-x"
              @update:model-value="refresh(1)"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VTable>
        <thead>
          <tr>
            <th>Mijoz</th>
            <th>Chek</th>
            <th>Summa</th>
            <th>To'landi</th>
            <th>Qoldiq</th>
            <th>Holati</th>
            <th style="width: 140px">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in debtsStore.debts" :key="d.id">
            <td>
              {{ d.customer?.fullName }}
              <div class="text-caption text-medium-emphasis">{{ d.customer?.phone }}</div>
            </td>
            <td>{{ d.order ? `#${d.order.id}` : '-' }}</td>
            <td>{{ formatMoney(d.amount) }}</td>
            <td>{{ formatMoney(d.paidAmount) }}</td>
            <td class="font-weight-medium">{{ formatMoney(d.remainingAmount) }}</td>
            <td>
              <VChip :color="statusColor(d.status)" size="small">
                {{ statusLabel(d.status) }}
              </VChip>
            </td>
            <td>
              <VBtn
                v-if="d.status === 'open'"
                size="small"
                color="primary"
                variant="tonal"
                @click="openPayment(d)"
              >
                To'lov
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>

      <div v-if="debtsStore.total > 0" class="d-flex justify-center pa-4">
        <VPagination
          v-model="debtsStore.page"
          :length="Math.ceil(debtsStore.total / debtsStore.limit)"
          :total-visible="5"
          @update:model-value="refresh"
        />
      </div>
    </VCard>

    <VDialog v-model="paymentDialog" max-width="400">
      <VCard title="Qarzga to'lov qo'shish">
        <VCardText v-if="activeDebt">
          <p class="mb-3">
            {{ activeDebt.customer?.fullName }} — qoldiq:
            <strong>{{ formatMoney(activeDebt.remainingAmount) }} so'm</strong>
          </p>

          <AppTextField
            v-model.number="paymentForm.amount"
            type="number"
            label="Summa"
            class="mb-3"
          />

          <AppSelect
            v-model="paymentForm.paymentType"
            :items="paymentTypeOptions"
            item-title="title"
            item-value="value"
            label="To'lov turi"
            class="mb-3"
          />

          <AppTextField v-model="paymentForm.note" label="Izoh (ixtiyoriy)" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="paymentDialog = false">Bekor qilish</VBtn>
          <VBtn
            color="primary"
            :disabled="!paymentForm.amount || paymentForm.amount <= 0"
            @click="submitPayment"
          >
            Saqlash
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script lang="ts" setup>
import { useDebtsStore } from '@/@core/stores/debts'
import { useToastStore } from '@/@core/stores/toast.store'
import { Debt } from '@/interface/debt.interface'
import { useRoute } from 'vue-router'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const route = useRoute()
const debtsStore = useDebtsStore()
const toastStore = useToastStore()

const statusOptions = [
  { title: 'Ochiq', value: 'open' },
  { title: "To'langan", value: 'paid' },
  { title: 'Bekor qilingan', value: 'cancelled' },
]

const paymentTypeOptions = [
  { title: 'Naqd', value: 'cash' },
  { title: 'Karta', value: 'card' },
  { title: "O'tkazma", value: 'transfer' },
]

const statusFilter = ref<string | null>('open')

function statusColor(status: string) {
  if (status === 'open') return 'error'
  if (status === 'paid') return 'success'
  return 'grey'
}

function statusLabel(status: string) {
  return statusOptions.find(s => s.value === status)?.title ?? status
}

function refresh(page = 1) {
  const customerId = route.query.customerId ? Number(route.query.customerId) : undefined
  debtsStore
    .fetchDebts(page, statusFilter.value || undefined, customerId)
    .catch((error: any) => {
      toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
    })
}

const paymentDialog = ref(false)
const activeDebt = ref<Debt | null>(null)
const paymentForm = reactive({ amount: 0, paymentType: 'cash', note: '' })

function openPayment(debt: Debt) {
  activeDebt.value = debt
  paymentForm.amount = debt.remainingAmount
  paymentForm.paymentType = 'cash'
  paymentForm.note = ''
  paymentDialog.value = true
}

async function submitPayment() {
  if (!activeDebt.value) return
  try {
    await debtsStore.addPayment(activeDebt.value.id, { ...paymentForm })
    toastStore.success("To'lov qo'shildi")
    paymentDialog.value = false
    refresh(debtsStore.page)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}

onMounted(() => refresh(1))
</script>
