<template>
  <div>
    <VCard title="Kuzatuv jurnali (Audit)" class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6" md="3">
            <AppSelect
              v-model="filters.entityType"
              :items="entityTypeOptions"
              item-title="title"
              item-value="value"
              label="Bo'lim"
              clearable
              @update:model-value="refresh(1)"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppSelect
              v-model="filters.action"
              :items="actionOptions"
              item-title="title"
              item-value="value"
              label="Amal"
              clearable
              @update:model-value="refresh(1)"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppTextField
              v-model="filters.dateFrom"
              type="date"
              label="Sanadan"
              clearable
              @update:model-value="refresh(1)"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppTextField
              v-model="filters.dateTo"
              type="date"
              label="Sanagacha"
              clearable
              @update:model-value="refresh(1)"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VTable>
        <thead>
          <tr>
            <th>Vaqt</th>
            <th>Xodim</th>
            <th>Amal</th>
            <th>Bo'lim</th>
            <th>Nima</th>
            <th>Tafsilot</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in auditLogsStore.logs" :key="log.id">
            <td class="text-caption">{{ formatDate(log.createdAt) }}</td>
            <td>{{ log.userName || `#${log.userId}` }}</td>
            <td>
              <VChip :color="actionColor(log.action)" size="small">
                {{ actionLabel(log.action) }}
              </VChip>
            </td>
            <td>{{ entityTypeLabel(log.entityType) }}</td>
            <td>{{ log.entityLabel || '-' }}</td>
            <td>
              <div class="text-caption">{{ log.description }}</div>
              <div v-if="log.changes" class="mt-1">
                <div v-for="(change, field) in log.changes" :key="field" class="text-caption text-medium-emphasis">
                  <strong>{{ field }}:</strong>
                  <span class="text-error">{{ change.old ?? '—' }}</span>
                  →
                  <span class="text-success">{{ change.new ?? '—' }}</span>
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="!auditLogsStore.logs.length">
            <td colspan="6" class="text-center text-medium-emphasis py-6">Yozuvlar topilmadi</td>
          </tr>
        </tbody>
      </VTable>

      <div v-if="auditLogsStore.total > 0" class="d-flex justify-center pa-4">
        <VPagination
          v-model="page"
          :length="Math.max(Math.ceil(auditLogsStore.total / auditLogsStore.limit), 1)"
          :total-visible="6"
          @update:model-value="refresh"
        />
      </div>
    </VCard>
  </div>
</template>

<script lang="ts" setup>
import { useAuditLogsStore } from '@/@core/stores/auditLogs'
import { useToastStore } from '@/@core/stores/toast.store'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const auditLogsStore = useAuditLogsStore()
const toastStore = useToastStore()

const page = ref(1)
const filters = reactive({
  entityType: null as string | null,
  action: null as string | null,
  dateFrom: '',
  dateTo: '',
})

const entityTypeOptions = [
  { title: 'Mahsulot', value: 'Product' },
  { title: 'Chek', value: 'Order' },
  { title: 'Qarz', value: 'Debt' },
  { title: 'Foydalanuvchi', value: 'User' },
]

const actionOptions = [
  { title: 'Yaratildi', value: 'create' },
  { title: 'Yangilandi', value: 'update' },
  { title: "O'chirildi", value: 'delete' },
  { title: 'Bekor qilindi', value: 'cancel' },
  { title: 'Qaytarildi', value: 'return' },
  { title: "To'lov", value: 'payment' },
  { title: 'Kirish', value: 'login' },
]

function actionLabel(action: string) {
  return actionOptions.find(a => a.value === action)?.title ?? action
}

function actionColor(action: string) {
  const map: Record<string, string> = {
    create: 'success',
    update: 'info',
    delete: 'error',
    cancel: 'error',
    return: 'warning',
    payment: 'primary',
    login: 'secondary',
  }
  return map[action] ?? 'default'
}

function entityTypeLabel(type: string) {
  return entityTypeOptions.find(e => e.value === type)?.title ?? type
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

async function refresh(p: number = 1) {
  page.value = p
  try {
    await auditLogsStore.fetchLogs(p, {
      entityType: filters.entityType || undefined,
      action: filters.action || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    })
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

onMounted(() => refresh(1))
</script>
