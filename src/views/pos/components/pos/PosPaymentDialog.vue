<script lang="ts" setup>
import { ref, reactive, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useCustomersStore } from '@/@core/stores/customers'
import { usePosStore } from '@/@core/stores/pos'
import { useToastStore } from '@/@core/stores/toast.store'
import { formatMoney, round2 } from '@/utils/posFormat'

const props = defineProps<{
  grandTotal: number
  effectivePaid: number
  changeAmount: number
  debtAmount: number
  checkingOut: boolean
  isOnline: boolean
}>()

const open = defineModel<boolean>({ required: true })
const tab = defineModel<'pay' | 'debt'>('tab', { required: true })
const autoPrint = defineModel<boolean>('autoPrint', { required: true })

const emit = defineEmits<{ (e: 'checkout'): void }>()

const customersStore = useCustomersStore()
const toastStore = useToastStore()
const { mixedCash, mixedCard, mixedTouched, customerId } = storeToRefs(usePosStore())

// ── Naqd / karta ──
function fillAllCash() {
  mixedCash.value = props.grandTotal
  mixedCard.value = 0
  mixedTouched.value = true
}
function fillAllCard() {
  mixedCard.value = props.grandTotal
  mixedCash.value = 0
  mixedTouched.value = true
}
function autoFillCard() {
  mixedCard.value = round2(Math.max(props.grandTotal - mixedCash.value, 0))
  mixedTouched.value = true
}

// Modal ochilganda: "To'lov" tabi, naqd = jami, fokus naqd maydonida
const cashInputRef = ref()
watch(open, isOpen => {
  if (!isOpen) return
  tab.value = 'pay'
  if (!mixedTouched.value) {
    mixedCash.value = props.grandTotal
    mixedCard.value = 0
  }
  setTimeout(() => {
    const input = cashInputRef.value?.$el?.querySelector('input')
    input?.focus()
    input?.select()
  }, 150)
})

// ── Mijoz ──
const customerSearch = ref('')
const customerLoading = ref(false)
const newCustomerInline = ref(false)
const newCustomer = reactive({ fullName: '', phone: '' })

const onCustomerSearch = useDebounceFn(async (value: string) => {
  if (!value || !props.isOnline) return
  customerLoading.value = true
  try {
    await customersStore.fetchCustomers(1, value)
  } finally {
    customerLoading.value = false
  }
}, 350)

async function createCustomer() {
  try {
    const created = await customersStore.createCustomer({
      fullName: newCustomer.fullName,
      phone: newCustomer.phone || undefined,
    })
    customersStore.customers.unshift(created)
    customerId.value = created.id
    newCustomerInline.value = false
    newCustomer.fullName = ''
    newCustomer.phone = ''
    toastStore.success("Mijoz qo'shildi")
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}
</script>

<template>
  <VDialog v-model="open" max-width="520">
    <VCard>
      <VCardItem>
        <VCardTitle>To'lov</VCardTitle>
        <template #append>
          <VBtn icon variant="text" size="small" @click="open = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </template>
      </VCardItem>

      <VCardText>
        <div class="d-flex justify-space-between align-center mb-3">
          <span class="text-medium-emphasis">To'lanadi:</span>
          <span class="text-h5 font-weight-bold">{{ formatMoney(grandTotal) }} so'm</span>
        </div>

        <VTabs v-model="tab" density="compact" class="mb-4">
          <VTab value="pay">To'lov</VTab>
          <VTab value="debt">
            Qarz
            <VChip v-if="debtAmount > 0" size="x-small" color="error" class="ml-1">
              {{ formatMoney(debtAmount) }}
            </VChip>
          </VTab>
        </VTabs>

        <div v-if="tab === 'pay'">
          <VTextField ref="cashInputRef" v-model.number="mixedCash" type="number" label="Naqd" suffix="so'm"
            variant="outlined" class="mb-3" @update:model-value="mixedTouched = true"
            @keydown.enter.prevent="emit('checkout')" />

          <VTextField v-model.number="mixedCard" type="number" label="Karta" suffix="so'm" variant="outlined"
            class="mb-3" @update:model-value="mixedTouched = true" @keydown.enter.prevent="emit('checkout')">
            <template #prepend>
              <VBtn icon size="small" variant="tonal" color="primary" title="Qolgan summani kartaga hisoblash"
                @click="autoFillCard">
                <VIcon icon="tabler-calculator" size="18" />
              </VBtn>
            </template>
          </VTextField>

          <div class="d-flex gap-2 flex-wrap mb-4">
            <VBtn size="small" variant="tonal" @click="fillAllCash">To'liq naqd</VBtn>
            <VBtn size="small" variant="tonal" @click="fillAllCard">To'liq karta</VBtn>
          </div>

          <div class="d-flex justify-space-between mb-1 text-body-2">
            <span class="text-medium-emphasis">To'landi:</span>
            <span>{{ formatMoney(effectivePaid) }} so'm</span>
          </div>
          <div v-if="changeAmount > 0" class="d-flex justify-space-between mb-1 text-success">
            <span>Qaytim:</span>
            <span class="font-weight-medium">{{ formatMoney(changeAmount) }} so'm</span>
          </div>
          <div v-if="debtAmount > 0" class="d-flex justify-space-between mb-1 text-error">
            <span>Qarz qoladi:</span>
            <span class="font-weight-medium">{{ formatMoney(debtAmount) }} so'm</span>
          </div>
        </div>

        <div v-else>
          <p class="text-body-2 mb-3">
            Qarz summasi: <strong class="text-error">{{ formatMoney(debtAmount) }} so'm</strong>
            (Naqd + Karta jamidan qolgani avtomatik qarz bo'ladi)
          </p>

          <VAutocomplete v-model="customerId" v-model:search="customerSearch" :items="customersStore.customers"
            item-title="fullName" item-value="id" label="Mijoz" variant="outlined" :loading="customerLoading"
            :disabled="!isOnline" clearable no-filter class="mb-2" @update:search="onCustomerSearch" />

          <VBtn v-if="!newCustomerInline" variant="tonal" prepend-icon="tabler-user-plus" size="small"
            :disabled="!isOnline" @click="newCustomerInline = true">
            Yangi mijoz
          </VBtn>

          <div v-else class="mt-2">
            <VTextField v-model="newCustomer.fullName" label="Ism familiya" variant="outlined" density="compact"
              class="mb-2" />
            <VTextField v-model="newCustomer.phone" label="Telefon" variant="outlined" density="compact"
              class="mb-2" />
            <div class="d-flex gap-2">
              <VBtn size="small" variant="tonal" @click="newCustomerInline = false">Bekor</VBtn>
              <VBtn size="small" color="primary" :disabled="!newCustomer.fullName" @click="createCustomer">
                Saqlash
              </VBtn>
            </div>
          </div>

          <p v-if="!isOnline" class="text-caption text-warning mt-2">
            Oflaynda faqat keshlangan mijozlardan tanlanadi
          </p>
        </div>

        <VDivider class="my-4" />

        <VSwitch v-model="autoPrint" color="primary" density="compact" hide-details
          label="Chekni avtomatik chop etish" class="mb-4" />

        <div class="d-flex gap-2">
          <VBtn variant="tonal" @click="open = false">Yopish</VBtn>
          <VBtn size="large" color="primary" class="flex-grow-1" :disabled="checkingOut" :loading="checkingOut"
            @click="emit('checkout')">
            Yakunlash
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>
