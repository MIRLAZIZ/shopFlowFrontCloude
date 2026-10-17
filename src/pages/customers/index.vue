<template>
  <div>
    <VAlert v-if="!isOnline" type="warning" variant="tonal" density="compact" class="mb-4">
      Oflayn rejim — keshdagi ma'lumotlar ko'rsatilmoqda. O'zgartirish (qo'shish, tahrirlash,
      qarz tarixi) internet qaytganda ishlaydi.
    </VAlert>

    <VCard title="Mijozlar" class="mb-6">
      <template #append>
        <VBtn color="primary" prepend-icon="tabler-plus" :disabled="!isOnline" @click="openCreate">
          Mijoz qo'shish
        </VBtn>
      </template>

      <VCardText>
        <AppTextField
          v-model="search"
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          prepend-inner-icon="tabler-search"
          clearable
          density="compact"
        />
      </VCardText>

      <VDivider />

      <VTable>
        <thead>
          <tr>
            <th>Ism familiya</th>
            <th>Telefon</th>
            <th>Ochiq qarz</th>
            <th style="width: 120px">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in customersStore.customers" :key="c.id">
            <td>{{ c.fullName }}</td>
            <td>{{ c.phone || '-' }}</td>
            <td>
              <VChip v-if="c.totalDebt > 0" color="error" size="small">
                {{ formatMoney(c.totalDebt) }} so'm
              </VChip>
              <span v-else>-</span>
            </td>
            <td>
              <IconBtn :disabled="!isOnline" @click="openEdit(c)">
                <VIcon icon="tabler-edit" color="success" />
              </IconBtn>
              <IconBtn title="Qarz tarixi" :disabled="!isOnline" @click="openHistory(c.id)">
                <VIcon icon="tabler-history" color="warning" />
              </IconBtn>
              <IconBtn :disabled="!isOnline" @click="remove(c.id)">
                <VIcon icon="tabler-trash" color="error" />
              </IconBtn>
            </td>
          </tr>
        </tbody>
      </VTable>

      <div
        v-if="customersStore.total > 0"
        class="d-flex justify-center pa-4"
      >
        <VPagination
          v-model="customersStore.page"
          :length="Math.ceil(customersStore.total / customersStore.limit)"
          :total-visible="5"
          @update:model-value="refresh"
        />
      </div>
    </VCard>

    <VDialog v-model="dialog" max-width="420">
      <VCard :title="editingId ? 'Mijozni tahrirlash' : 'Yangi mijoz'">
        <VCardText>
          <AppTextField v-model="form.fullName" label="Ism familiya" class="mb-3" />
          <AppTextField v-model="form.phone" label="Telefon" class="mb-3" />
          <AppTextField v-model="form.note" label="Izoh" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="dialog = false">Bekor qilish</VBtn>
          <VBtn color="primary" :disabled="!form.fullName" @click="save">Saqlash</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <CustomerHistoryDialog v-model="historyDialog" :customer-id="historyCustomerId" @changed="refresh(customersStore.page)" />

    <DelateDialog v-model:delete-modal="deleteModal" @delete-element="confirmDelete" />
  </div>
</template>

<script lang="ts" setup>
import { useCustomersStore } from '@/@core/stores/customers'
import { useToastStore } from '@/@core/stores/toast.store'
import { Customer } from '@/interface/customer.interface'
import { useDebounceFn, useOnline } from '@vueuse/core'
import { useOfflineStore } from '@/@core/stores/offline'
import CustomerHistoryDialog from '@/components/CustomerHistoryDialog.vue'
import { useRouter } from 'vue-router'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const router = useRouter()
const customersStore = useCustomersStore()
const offlineStore = useOfflineStore()
const toastStore = useToastStore()

const search = ref('')
const dialog = ref(false)
const editingId = ref<number | null>(null)
const deleteModal = ref(false)
const pendingDeleteId = ref<number | null>(null)

const form = reactive({ fullName: '', phone: '', note: '' })

// Qarz tarixi (qarzlar, to'lovlar, nima olgani — chek bilan)
const historyDialog = ref(false)
const historyCustomerId = ref<number | null>(null)

function openHistory(id: number) {
  historyCustomerId.value = id
  historyDialog.value = true
}

const isOnline = useOnline()

// Oflayn rejim: internet yo'q bo'lsa kassadagi kabi IndexedDB keshidan o'qiladi
async function loadFromCache() {
  const cached = await offlineStore.getCachedCustomers()
  const q = search.value.trim().toLowerCase()
  const filtered = cached.filter(
    (c: any) => !q || c.fullName?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q),
  )
  customersStore.customers = filtered
  customersStore.total = filtered.length
  customersStore.limit = Math.max(filtered.length, 1)
  customersStore.page = 1
}

function refresh(page = 1) {
  if (!isOnline.value) {
    loadFromCache()
    return
  }
  customersStore.fetchCustomers(page, search.value || undefined).catch((error: any) => {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  })
}

watch(isOnline, () => refresh(1))

const debouncedSearch = useDebounceFn(() => refresh(1), 400)
watch(search, debouncedSearch)

function openCreate() {
  editingId.value = null
  form.fullName = ''
  form.phone = ''
  form.note = ''
  dialog.value = true
}

function openEdit(c: Customer) {
  editingId.value = c.id
  form.fullName = c.fullName
  form.phone = c.phone || ''
  form.note = c.note || ''
  dialog.value = true
}

async function save() {
  try {
    if (editingId.value) {
      await customersStore.updateCustomer(editingId.value, { ...form })
    } else {
      await customersStore.createCustomer({ ...form })
    }
    toastStore.success('Saqlandi')
    dialog.value = false
    refresh(customersStore.page)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

function remove(id: number) {
  pendingDeleteId.value = id
  deleteModal.value = true
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  try {
    await customersStore.deleteCustomer(pendingDeleteId.value)
    toastStore.success("O'chirildi")
    deleteModal.value = false
    refresh(customersStore.page)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}

onMounted(() => refresh(1))
</script>
