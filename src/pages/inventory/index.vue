<template>
  <div>
    <!-- ═══════════════ SESSIYALAR RO'YXATI ═══════════════ -->
    <VCard v-if="!activeSession" title="Inventarizatsiya" class="mb-6">
      <template #append>
        <VBtn color="primary" prepend-icon="tabler-clipboard-list" @click="startNew">
          Yangi inventarizatsiya
        </VBtn>
      </template>

      <VTable>
        <thead>
          <tr>
            <th>№</th>
            <th>Boshlangan</th>
            <th>Holati</th>
            <th>Sanalgan / Jami</th>
            <th>Izoh</th>
            <th style="width: 80px" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in inventoryStore.sessions" :key="s.id">
            <td>#{{ s.id }}</td>
            <td>{{ formatDate(s.createdAt) }}</td>
            <td>
              <VChip :color="statusColor(s.status)" size="small">{{ statusLabel(s.status) }}</VChip>
            </td>
            <td>{{ s.countedItems }} / {{ s.totalItems }}</td>
            <td class="text-caption">{{ s.note || '-' }}</td>
            <td>
              <IconBtn size="small" @click="openSession(s.id)">
                <VIcon icon="tabler-eye" />
              </IconBtn>
            </td>
          </tr>
          <tr v-if="!inventoryStore.sessions.length">
            <td colspan="6" class="text-center text-medium-emphasis py-6">
              Hali inventarizatsiya o'tkazilmagan
            </td>
          </tr>
        </tbody>
      </VTable>

      <div v-if="inventoryStore.total > 0" class="d-flex justify-center pa-4">
        <VPagination
          v-model="page"
          :length="Math.max(Math.ceil(inventoryStore.total / inventoryStore.limit), 1)"
          :total-visible="6"
          @update:model-value="refresh"
        />
      </div>
    </VCard>

    <!-- ═══════════════ SESSIYA TAFSILOTI ═══════════════ -->
    <template v-else>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-2">
        <div class="d-flex align-center gap-3">
          <VBtn icon variant="text" @click="closeSession">
            <VIcon icon="tabler-arrow-left" />
          </VBtn>
          <h5 class="text-h5">Inventarizatsiya #{{ activeSession.id }}</h5>
          <VChip :color="statusColor(activeSession.status)" size="small">
            {{ statusLabel(activeSession.status) }}
          </VChip>
        </div>

        <div v-if="activeSession.status === 'open'" class="d-flex gap-2">
          <VBtn variant="tonal" color="error" @click="confirmCancel">Bekor qilish</VBtn>
          <VBtn
            color="primary"
            :disabled="activeSession.summary.countedItems === 0"
            :loading="completing"
            @click="confirmComplete"
          >
            Yakunlash
          </VBtn>
        </div>
      </div>

      <!-- Xulosa kartalari -->
      <VRow class="mb-4">
        <VCol cols="6" sm="3">
          <VCard variant="tonal">
            <VCardText class="text-center">
              <div class="text-h6">{{ activeSession.summary.countedItems }} / {{ activeSession.summary.totalItems }}</div>
              <div class="text-caption text-medium-emphasis">Sanalgan</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" sm="3">
          <VCard variant="tonal" color="warning">
            <VCardText class="text-center">
              <div class="text-h6">{{ activeSession.summary.itemsWithDifference }}</div>
              <div class="text-caption">Farq topilgan</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" sm="3">
          <VCard variant="tonal" color="success">
            <VCardText class="text-center">
              <div class="text-h6">+{{ formatQty(activeSession.summary.surplusQuantity) }}</div>
              <div class="text-caption">Ortiqcha (dona)</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" sm="3">
          <VCard variant="tonal" color="error">
            <VCardText class="text-center">
              <div class="text-h6">-{{ formatQty(activeSession.summary.shortageQuantity) }}</div>
              <div class="text-caption">Kamomad ({{ formatMoney(activeSession.summary.shortageValue) }} so'm)</div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VCard>
        <VCardText>
          <AppTextField
            v-model="itemSearch"
            placeholder="Mahsulot nomi bo'yicha qidirish..."
            prepend-inner-icon="tabler-search"
            density="compact"
            clearable
          />
        </VCardText>
        <VTable>
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th class="text-end">Tizimda</th>
              <th style="width: 140px">Sanalgan</th>
              <th class="text-end">Farq</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td>{{ item.productName }}</td>
              <td class="text-end">{{ formatQty(item.systemQuantity) }}</td>
              <td>
                <VTextField
                  :model-value="item.countedQuantity"
                  type="number"
                  density="compact"
                  hide-details
                  :disabled="activeSession.status !== 'open'"
                  placeholder="—"
                  @update:model-value="val => onCountInput(item, val)"
                />
              </td>
              <td class="text-end">
                <span v-if="item.difference === null" class="text-medium-emphasis">-</span>
                <span
                  v-else
                  :class="item.difference > 0 ? 'text-success' : item.difference < 0 ? 'text-error' : ''"
                >
                  {{ item.difference > 0 ? '+' : '' }}{{ formatQty(item.difference) }}
                </span>
              </td>
            </tr>
            <tr v-if="!filteredItems.length">
              <td colspan="4" class="text-center text-medium-emphasis py-6">Mahsulot topilmadi</td>
            </tr>
          </tbody>
        </VTable>
      </VCard>
    </template>

    <!-- Yangi sessiya izohi -->
    <VDialog v-model="newSessionDialog" max-width="420">
      <VCard title="Yangi inventarizatsiya boshlash">
        <VCardText>
          <p class="text-body-2 mb-3">
            Joriy barcha mahsulot partiyalari ro'yxatga olinadi. Har birini sanab, haqiqiy
            miqdorini kiritasiz.
          </p>
          <AppTextField v-model="newSessionNote" label="Izoh (ixtiyoriy)" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="newSessionDialog = false">Bekor qilish</VBtn>
          <VBtn color="primary" :loading="starting" @click="confirmStart">Boshlash</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Yakunlash tasdiqlash -->
    <VDialog v-model="completeDialog" max-width="420">
      <VCard title="Inventarizatsiyani yakunlash">
        <VCardText>
          <p class="text-body-2 mb-2">
            Sanalgan <strong>{{ activeSession?.summary.countedItems }}</strong> ta mahsulot bo'yicha
            tizimdagi qoldiq haqiqiy miqdorga moslashtiriladi.
          </p>
          <p v-if="(activeSession?.summary.pendingItems ?? 0) > 0" class="text-warning text-body-2 mb-3">
            ⚠️ {{ activeSession?.summary.pendingItems }} ta mahsulot hali sanalmagan — ular
            o'zgarishsiz qoladi.
          </p>
          <p class="text-error text-body-2 mb-3">
            Bu amalni qaytarib bo'lmaydi.
          </p>
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="completeDialog = false">Yo'q</VBtn>
          <VBtn color="primary" :loading="completing" @click="doComplete">Ha, yakunlash</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <DelateDialog v-model:delete-modal="cancelDialog" @delete-element="doCancel" />
  </div>
</template>

<script lang="ts" setup>
import { useInventoryStore } from '@/@core/stores/inventory'
import { useToastStore } from '@/@core/stores/toast.store'
import { InventoryItem, InventorySession } from '@/interface/inventory.interface'
import { useDebounceFn } from '@vueuse/core'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const inventoryStore = useInventoryStore()
const toastStore = useToastStore()

const page = ref(1)
const activeSession = ref<InventorySession | null>(null)
const itemSearch = ref('')

const filteredItems = computed(() => {
  if (!activeSession.value) return []
  if (!itemSearch.value.trim()) return activeSession.value.items
  const q = itemSearch.value.trim().toLowerCase()
  return activeSession.value.items.filter(i => i.productName.toLowerCase().includes(q))
})

function statusLabel(status: string) {
  return { open: 'Davom etmoqda', completed: 'Yakunlangan', cancelled: 'Bekor qilingan' }[status] ?? status
}
function statusColor(status: string) {
  return { open: 'warning', completed: 'success', cancelled: 'error' }[status] ?? 'default'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}
function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}
function formatDate(value: string) {
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

async function refresh(p: number = 1) {
  page.value = p
  try {
    await inventoryStore.fetchSessions(p)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

async function openSession(id: number) {
  try {
    activeSession.value = await inventoryStore.fetchSession(id)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

function closeSession() {
  activeSession.value = null
  itemSearch.value = ''
  refresh(page.value)
}

// ─────────────────────────── Yangi sessiya ───────────────────────────
const newSessionDialog = ref(false)
const newSessionNote = ref('')
const starting = ref(false)

function startNew() {
  newSessionNote.value = ''
  newSessionDialog.value = true
}

async function confirmStart() {
  starting.value = true
  try {
    const session = await inventoryStore.startSession(newSessionNote.value || undefined)
    newSessionDialog.value = false
    activeSession.value = session
    toastStore.success('Inventarizatsiya boshlandi')
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  } finally {
    starting.value = false
  }
}

// ─────────────────────────── Sanash ───────────────────────────
const debouncedCount = useDebounceFn(async (item: InventoryItem, value: number) => {
  if (!activeSession.value) return
  try {
    const result: any = await inventoryStore.recordCount(activeSession.value.id, item.batchId, value)
    const idx = activeSession.value.items.findIndex(i => i.id === item.id)
    if (idx !== -1) {
      activeSession.value.items[idx] = { ...activeSession.value.items[idx], ...result.data }
    }
    // Xulosani yangilash uchun qayta yuklaymiz (yengil so'rov)
    activeSession.value = await inventoryStore.fetchSession(activeSession.value.id)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}, 500)

function onCountInput(item: InventoryItem, value: any) {
  const num = Number(value)
  if (Number.isNaN(num) || value === '' || value === null) return
  item.countedQuantity = num
  debouncedCount(item, num)
}

// ─────────────────────────── Yakunlash ───────────────────────────
const completeDialog = ref(false)
const completing = ref(false)

function confirmComplete() {
  completeDialog.value = true
}

async function doComplete() {
  if (!activeSession.value) return
  completing.value = true
  try {
    const result = await inventoryStore.completeSession(activeSession.value.id)
    activeSession.value = result.session
    completeDialog.value = false
    toastStore.success(result.message)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  } finally {
    completing.value = false
  }
}

// ─────────────────────────── Bekor qilish ───────────────────────────
const cancelDialog = ref(false)

function confirmCancel() {
  cancelDialog.value = true
}

async function doCancel() {
  if (!activeSession.value) return
  try {
    await inventoryStore.cancelSession(activeSession.value.id)
    toastStore.success('Bekor qilindi')
    cancelDialog.value = false
    closeSession()
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

onMounted(() => refresh(1))
</script>
