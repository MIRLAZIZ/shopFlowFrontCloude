<template>
  <VDialog
    :model-value="modelValue"
    max-width="820"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardItem>
        <VCardTitle>{{ history?.customer.fullName || 'Mijoz' }}</VCardTitle>
        <VCardSubtitle>{{ history?.customer.phone || '' }}</VCardSubtitle>
        <template #append>
          <VBtn icon variant="text" size="small" @click="emit('update:modelValue', false)">
            <VIcon icon="tabler-x" />
          </VBtn>
        </template>
      </VCardItem>

      <VCardText>
        <VProgressLinear v-if="loading" indeterminate color="primary" class="mb-3" />

        <template v-if="history">
          <!-- Xulosa -->
          <VRow class="mb-3">
            <VCol cols="4">
              <VCard variant="tonal">
                <VCardText class="text-center pa-3">
                  <div class="text-subtitle-1 font-weight-bold">{{ money(history.summary.totalDebt) }}</div>
                  <div class="text-caption">Jami qarz olingan</div>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="4">
              <VCard variant="tonal" color="success">
                <VCardText class="text-center pa-3">
                  <div class="text-subtitle-1 font-weight-bold">{{ money(history.summary.totalPaid) }}</div>
                  <div class="text-caption">To'langan</div>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="4">
              <VCard variant="tonal" :color="history.summary.totalRemaining > 0 ? 'error' : undefined">
                <VCardText class="text-center pa-3">
                  <div class="text-subtitle-1 font-weight-bold">{{ money(history.summary.totalRemaining) }}</div>
                  <div class="text-caption">Hozirgi qoldiq</div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <div class="d-flex justify-end mb-3">
            <VBtn size="small" variant="tonal" prepend-icon="tabler-plus" @click="openManual">
              Qarz qo'shish
            </VBtn>
          </div>

          <p v-if="!history.debts.length" class="text-center text-medium-emphasis py-8">
            Bu mijozning qarzlari yo'q
          </p>

          <!-- Qarzlar ro'yxati -->
          <VExpansionPanels v-else variant="accordion">
            <VExpansionPanel v-for="d in history.debts" :key="d.id">
              <VExpansionPanelTitle>
                <div class="d-flex align-center justify-space-between w-100 pe-3 flex-wrap gap-2">
                  <div>
                    <div class="font-weight-medium">
                      {{ d.order ? `Chek #${d.order.id}` : "Qo'lda kiritilgan qarz" }}
                      <span class="text-caption text-medium-emphasis ml-1">{{ date(d.createdAt) }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Qarz: {{ money(d.amount) }} · To'langan: {{ money(d.paidAmount) }}
                    </div>
                  </div>
                  <div class="d-flex align-center gap-2">
                    <span v-if="d.status === 'open'" class="text-error font-weight-bold">
                      {{ money(d.remainingAmount) }}
                    </span>
                    <VChip :color="statusColor(d.status)" size="small">{{ statusLabel(d.status) }}</VChip>
                  </div>
                </div>
              </VExpansionPanelTitle>

              <VExpansionPanelText>
                <!-- Nima olgan (bog'langan chek) -->
                <div v-if="d.order" class="mb-4">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-subtitle-2">Nima olgan (chek #{{ d.order.id }})</span>
                    <VBtn size="x-small" variant="text" prepend-icon="tabler-receipt" @click="openReceipt(d.order.id)">
                      Chekni ochish
                    </VBtn>
                  </div>
                  <VTable density="compact">
                    <thead>
                      <tr>
                        <th>Mahsulot</th>
                        <th class="text-end">Miqdor</th>
                        <th class="text-end">Narx</th>
                        <th class="text-end">Summa</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, i) in d.order.items" :key="i">
                        <td>{{ it.productName }}</td>
                        <td class="text-end">{{ qty(it.quantity) }}{{ it.unit ? ' ' + it.unit : '' }}</td>
                        <td class="text-end">{{ money(it.price) }}</td>
                        <td class="text-end">{{ money(it.total) }}</td>
                      </tr>
                    </tbody>
                  </VTable>
                  <div class="d-flex justify-space-between text-caption mt-1">
                    <span>Chek jami: {{ money(d.order.total) }}</span>
                    <span>Shu zahoti to'langan: {{ money(d.order.paidAmount) }}</span>
                    <span class="text-error">Qarzga: {{ money(d.order.debtAmount) }}</span>
                  </div>
                </div>
                <p v-else class="text-caption text-medium-emphasis mb-3">
                  Bu qarz chekka biriktirilmagan.
                  <span v-if="d.note">Izoh: {{ d.note }}</span>
                </p>

                <!-- To'lovlar tarixi -->
                <div class="text-subtitle-2 mb-1">To'lovlar tarixi</div>
                <VTable v-if="d.payments.length" density="compact" class="mb-3">
                  <thead>
                    <tr>
                      <th>Sana</th>
                      <th>Turi</th>
                      <th class="text-end">Summa</th>
                      <th>Izoh</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in d.payments" :key="p.id">
                      <td>{{ date(p.createdAt) }}</td>
                      <td>{{ paymentLabel(p.paymentType) }}</td>
                      <td class="text-end">{{ money(p.amount) }}</td>
                      <td class="text-caption">{{ p.note || '-' }}</td>
                    </tr>
                  </tbody>
                </VTable>
                <p v-else class="text-caption text-medium-emphasis mb-3">Hali to'lov qilinmagan</p>

                <!-- To'lov qabul qilish -->
                <div v-if="d.status === 'open'">
                  <div v-if="payingDebtId !== d.id">
                    <VBtn size="small" color="primary" variant="tonal" @click="startPayment(d)">
                      To'lov qabul qilish
                    </VBtn>
                  </div>
                  <div v-else class="d-flex gap-2 flex-wrap align-center">
                    <VTextField
                      v-model.number="payForm.amount"
                      type="number"
                      label="Summa"
                      suffix="so'm"
                      density="compact"
                      hide-details
                      style="max-inline-size: 170px"
                    />
                    <VSelect
                      v-model="payForm.paymentType"
                      :items="paymentTypes"
                      item-title="title"
                      item-value="value"
                      density="compact"
                      hide-details
                      style="max-inline-size: 130px"
                    />
                    <VTextField
                      v-model="payForm.note"
                      label="Izoh"
                      density="compact"
                      hide-details
                      style="max-inline-size: 200px"
                    />
                    <VBtn size="small" variant="tonal" @click="payingDebtId = null">Bekor</VBtn>
                    <VBtn size="small" color="primary" :loading="saving" :disabled="!payForm.amount" @click="submitPayment(d)">
                      Saqlash
                    </VBtn>
                  </div>
                </div>
              </VExpansionPanelText>
            </VExpansionPanel>
          </VExpansionPanels>
        </template>
      </VCardText>
    </VCard>

    <!-- Qo'lda qarz qo'shish -->
    <VDialog v-model="manualDialog" max-width="420">
      <VCard title="Qarz qo'shish">
        <VCardText>
          <AppTextField v-model.number="manualForm.amount" type="number" label="Summa (so'm)" class="mb-3" />
          <AppTextField v-model="manualForm.orderId" type="number" label="Chek raqami (ixtiyoriy)" class="mb-3" />
          <AppTextField v-model="manualForm.dueDate" type="date" label="To'lash muddati (ixtiyoriy)" class="mb-3" />
          <AppTextField v-model="manualForm.note" label="Izoh (ixtiyoriy)" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="manualDialog = false">Bekor qilish</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!manualForm.amount" @click="submitManual">
            Saqlash
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </VDialog>
</template>

<script lang="ts" setup>
import { useCustomersStore } from '@/@core/stores/customers'
import { useDebtsStore } from '@/@core/stores/debts'
import { useToastStore } from '@/@core/stores/toast.store'
import { CustomerDebtHistory, CustomerDebtHistoryDebt } from '@/interface/customer.interface'
import { useRouter } from 'vue-router'

const props = defineProps<{ modelValue: boolean; customerId: number | null }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'changed'): void
}>()

const customersStore = useCustomersStore()
const debtsStore = useDebtsStore()
const toastStore = useToastStore()
const router = useRouter()

const history = ref<CustomerDebtHistory | null>(null)
const loading = ref(false)
const saving = ref(false)

const paymentTypes = [
  { title: 'Naqd', value: 'cash' },
  { title: 'Karta', value: 'card' },
  { title: "O'tkazma", value: 'transfer' },
]

const money = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v || 0)) + " so'm"
const qty = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''))
const date = (v: string) =>
  new Date(v).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const statusLabel = (s: string) => ({ open: 'Ochiq', paid: "To'langan", cancelled: 'Bekor qilingan' } as Record<string, string>)[s] ?? s
const statusColor = (s: string) => ({ open: 'error', paid: 'success', cancelled: 'grey' } as Record<string, string>)[s] ?? 'default'
const paymentLabel = (t: string) => paymentTypes.find(p => p.value === t)?.title ?? t

async function load() {
  if (!props.customerId) return
  loading.value = true
  try {
    history.value = await customersStore.fetchDebtHistory(props.customerId)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.customerId],
  () => {
    if (props.modelValue && props.customerId) {
      history.value = null
      payingDebtId.value = null
      load()
    }
  },
  { immediate: true },
)

function openReceipt(orderId: number) {
  emit('update:modelValue', false)
  router.push({ path: '/receipts', query: { order: String(orderId) } })
}

// ─────────────────────────── To'lov qabul qilish ───────────────────────────
const payingDebtId = ref<number | null>(null)
const payForm = reactive({ amount: 0, paymentType: 'cash', note: '' })

function startPayment(d: CustomerDebtHistoryDebt) {
  payingDebtId.value = d.id
  payForm.amount = d.remainingAmount
  payForm.paymentType = 'cash'
  payForm.note = ''
}

async function submitPayment(d: CustomerDebtHistoryDebt) {
  saving.value = true
  try {
    await debtsStore.addPayment(d.id, { ...payForm, note: payForm.note || undefined })
    toastStore.success("To'lov qabul qilindi")
    payingDebtId.value = null
    await load()
    emit('changed')
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  } finally {
    saving.value = false
  }
}

// ─────────────────────────── Qo'lda qarz ───────────────────────────
const manualDialog = ref(false)
const manualForm = reactive({ amount: 0, orderId: '' as string | number, dueDate: '', note: '' })

function openManual() {
  manualForm.amount = 0
  manualForm.orderId = ''
  manualForm.dueDate = ''
  manualForm.note = ''
  manualDialog.value = true
}

async function submitManual() {
  if (!props.customerId) return
  saving.value = true
  try {
    await debtsStore.createManualDebt({
      customerId: props.customerId,
      amount: manualForm.amount,
      note: manualForm.note || undefined,
      dueDate: manualForm.dueDate || undefined,
      orderId: manualForm.orderId ? Number(manualForm.orderId) : undefined,
    })
    toastStore.success("Qarz qo'shildi")
    manualDialog.value = false
    await load()
    emit('changed')
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  } finally {
    saving.value = false
  }
}
</script>
