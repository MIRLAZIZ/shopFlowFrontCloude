<template>
  <div>
    <VCard title="Mijozlar" class="mb-6">
      <template #append>
        <VBtn color="primary" prepend-icon="tabler-plus" @click="openCreate">
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
              <IconBtn @click="openEdit(c)">
                <VIcon icon="tabler-edit" color="success" />
              </IconBtn>
              <IconBtn @click="router.push(`/debts?customerId=${c.id}`)">
                <VIcon icon="tabler-report-money" color="warning" />
              </IconBtn>
              <IconBtn @click="remove(c.id)">
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

    <DelateDialog v-model:delete-modal="deleteModal" @delete-element="confirmDelete" />
  </div>
</template>

<script lang="ts" setup>
import { useCustomersStore } from '@/@core/stores/customers'
import { useToastStore } from '@/@core/stores/toast.store'
import { Customer } from '@/interface/customer.interface'
import { useDebounceFn } from '@vueuse/core'
import { useRouter } from 'vue-router'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const router = useRouter()
const customersStore = useCustomersStore()
const toastStore = useToastStore()

const search = ref('')
const dialog = ref(false)
const editingId = ref<number | null>(null)
const deleteModal = ref(false)
const pendingDeleteId = ref<number | null>(null)

const form = reactive({ fullName: '', phone: '', note: '' })

function refresh(page = 1) {
  customersStore.fetchCustomers(page, search.value || undefined).catch((error: any) => {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  })
}

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
