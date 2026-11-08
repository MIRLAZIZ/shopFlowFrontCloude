<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-2">
      <h4 class="text-h4">Yetkazib beruvchilar</h4>
      <div class="d-flex gap-2">
        <VBtn variant="tonal" prepend-icon="tabler-user-plus" @click="openSupplierDialog()">Yetkazib beruvchi qo'shish</VBtn>
        <VBtn color="primary" prepend-icon="tabler-shopping-cart-plus" @click="openDebtDialog">Yangi xarid</VBtn>
      </div>
    </div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      Mahsulotni kimdan sotib olsangiz — shu yerda yozing. Qarzga olingan bo'lsa, to'lanmagan qismi
      <strong>sizning qarzingiz</strong> bo'lib turadi va aktivlar hisobida majburiyat sifatida ayriladi.
    </p>

    <!-- Xulosa -->
    <VRow class="mb-4">
      <VCol cols="12" sm="6">
        <VCard color="error" variant="tonal">
          <VCardText>
            <div class="text-caption">Jami qarzimiz (yetkazib beruvchilarga)</div>
            <div class="text-h5 font-weight-bold">{{ money(totalPayable) }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6">
        <VCard variant="tonal">
          <VCardText>
            <div class="text-caption">Yetkazib beruvchilar soni</div>
            <div class="text-h5 font-weight-bold">{{ financeStore.suppliers.length }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VTabs v-model="tab" class="mb-4">
      <VTab value="debts">Xaridlar va qarzlar</VTab>
      <VTab value="suppliers">Yetkazib beruvchilar</VTab>
    </VTabs>

    <!-- ═══════════════ XARIDLAR / QARZLAR ═══════════════ -->
    <VCard v-if="tab === 'debts'">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="filters.supplierId"
              :items="financeStore.suppliers"
              item-title="name"
              item-value="id"
              label="Yetkazib beruvchi"
              clearable
              @update:model-value="loadDebts(1)"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="filters.status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="Holati"
              clearable
              @update:model-value="loadDebts(1)"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VTable>
        <thead>
          <tr>
            <th>Sana</th>
            <th>Yetkazib beruvchi</th>
            <th class="text-end">Xarid summasi</th>
            <th class="text-end">To'langan</th>
            <th class="text-end">Qarz</th>
            <th>Muddat</th>
            <th>Holati</th>
            <th style="width: 150px">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in financeStore.debts" :key="d.id">
            <td>{{ dateText(d.debtDate) }}</td>
            <td>
              {{ d.supplier.name }}
              <div v-if="d.note" class="text-caption text-medium-emphasis">{{ d.note }}</div>
            </td>
            <td class="text-end">{{ money(d.amount) }}</td>
            <td class="text-end">{{ money(d.paidAmount) }}</td>
            <td class="text-end font-weight-bold" :class="{ 'text-error': d.remainingAmount > 0 }">
              {{ money(d.remainingAmount) }}
            </td>
            <td :class="{ 'text-error': isOverdue(d) }">{{ d.dueDate ? dateText(d.dueDate) : '-' }}</td>
            <td><VChip :color="statusColor(d.status)" size="small">{{ statusLabel(d.status) }}</VChip></td>
            <td>
              <VBtn v-if="d.status === 'open'" size="x-small" color="primary" variant="tonal" @click="openPayment(d)">
                To'lash
              </VBtn>
              <IconBtn size="small" title="To'lovlar tarixi" @click="detail = d; detailDialog = true">
                <VIcon icon="tabler-eye" />
              </IconBtn>
              <IconBtn v-if="d.status !== 'cancelled' && !d.payments.length" size="small" title="Bekor qilish" @click="cancelDebt(d.id)">
                <VIcon icon="tabler-x" color="error" />
              </IconBtn>
            </td>
          </tr>
          <tr v-if="!financeStore.debts.length">
            <td colspan="8" class="text-center text-medium-emphasis py-6">Xaridlar yo'q</td>
          </tr>
        </tbody>
      </VTable>

      <div v-if="financeStore.debtsTotal > 0" class="d-flex justify-center pa-4">
        <VPagination
          v-model="debtsPage"
          :length="Math.max(Math.ceil(financeStore.debtsTotal / financeStore.debtsLimit), 1)"
          :total-visible="6"
          @update:model-value="loadDebts"
        />
      </div>
    </VCard>

    <!-- ═══════════════ YETKAZIB BERUVCHILAR ═══════════════ -->
    <VCard v-else>
      <VTable>
        <thead>
          <tr>
            <th>Nomi</th>
            <th>Telefon</th>
            <th class="text-end">Qarzimiz</th>
            <th style="width: 100px">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in financeStore.suppliers" :key="s.id">
            <td>{{ s.name }}<div v-if="s.note" class="text-caption text-medium-emphasis">{{ s.note }}</div></td>
            <td>{{ s.phone || '-' }}</td>
            <td class="text-end" :class="{ 'text-error font-weight-bold': s.payable > 0 }">{{ money(s.payable) }}</td>
            <td>
              <IconBtn @click="openSupplierDialog(s)"><VIcon icon="tabler-edit" color="success" /></IconBtn>
              <IconBtn @click="askDeleteSupplier(s.id)"><VIcon icon="tabler-trash" color="error" /></IconBtn>
            </td>
          </tr>
          <tr v-if="!financeStore.suppliers.length">
            <td colspan="4" class="text-center text-medium-emphasis py-6">
              Hali yetkazib beruvchi qo'shilmagan
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- ═══════════════ YANGI XARID ═══════════════ -->
    <VDialog v-model="debtDialog" max-width="480">
      <VCard title="Yangi xarid (kirim)">
        <VCardText>
          <div class="d-flex gap-2 align-start mb-3">
            <AppSelect
              v-model="debtForm.supplierId"
              :items="financeStore.suppliers"
              item-title="name"
              item-value="id"
              label="Yetkazib beruvchi"
              class="flex-grow-1"
            />
            <VBtn icon variant="tonal" class="mt-6" title="Yangi yetkazib beruvchi" @click="openSupplierDialog()">
              <VIcon icon="tabler-plus" />
            </VBtn>
          </div>
          <AppTextField v-model.number="debtForm.amount" type="number" label="Xarid summasi (jami, so'm)" class="mb-3" />
          <VRow dense>
            <VCol cols="7">
              <AppTextField v-model.number="debtForm.paidAmount" type="number" label="Hozir to'landi (so'm)" />
            </VCol>
            <VCol cols="5">
              <AppSelect v-model="debtForm.paymentType" :items="paymentTypes" item-title="title" item-value="value" label="Qanday" />
            </VCol>
          </VRow>
          <div class="text-caption mb-3 mt-1" :class="debtRemaining > 0 ? 'text-error' : 'text-success'">
            {{ debtRemaining > 0 ? `Qarz bo'ladi: ${money(debtRemaining)}` : "To'liq to'langan (qarz yo'q)" }}
          </div>
          <VRow dense>
            <VCol cols="6"><AppTextField v-model="debtForm.debtDate" type="date" label="Xarid sanasi" /></VCol>
            <VCol cols="6"><AppTextField v-model="debtForm.dueDate" type="date" label="To'lash muddati" /></VCol>
          </VRow>
          <AppTextField v-model="debtForm.note" label="Izoh (masalan: piyoz 1 tonna)" class="mt-3" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="debtDialog = false">Bekor qilish</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!debtForm.supplierId || !debtForm.amount" @click="saveDebt">Saqlash</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ═══════════════ TO'LOV ═══════════════ -->
    <VDialog v-model="paymentDialog" max-width="400">
      <VCard title="Yetkazib beruvchiga to'lov">
        <VCardText v-if="payTarget">
          <p class="mb-3">
            {{ payTarget.supplier.name }} — qarz: <strong>{{ money(payTarget.remainingAmount) }}</strong>
          </p>
          <AppTextField v-model.number="payForm.amount" type="number" label="Summa (so'm)" class="mb-3" @keydown.enter.prevent="savePayment" />
          <AppSelect v-model="payForm.paymentType" :items="paymentTypes" item-title="title" item-value="value" label="Qanday to'lanadi" class="mb-3" />
          <AppTextField v-model="payForm.paymentDate" type="date" label="Sana" class="mb-3" />
          <AppTextField v-model="payForm.note" label="Izoh (ixtiyoriy)" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="paymentDialog = false">Bekor qilish</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!payForm.amount" @click="savePayment">Saqlash</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ═══════════════ TO'LOVLAR TARIXI ═══════════════ -->
    <VDialog v-model="detailDialog" max-width="460">
      <VCard v-if="detail" :title="`${detail.supplier.name} — xarid`">
        <VCardText>
          <div class="d-flex justify-space-between mb-1"><span>Xarid summasi:</span><strong>{{ money(detail.amount) }}</strong></div>
          <div class="d-flex justify-space-between mb-1"><span>To'langan:</span><span>{{ money(detail.paidAmount) }}</span></div>
          <div class="d-flex justify-space-between mb-3"><span>Qarz:</span><strong class="text-error">{{ money(detail.remainingAmount) }}</strong></div>
          <VDivider class="mb-2" />
          <div class="text-subtitle-2 mb-1">To'lovlar tarixi</div>
          <p v-if="!detail.payments.length" class="text-medium-emphasis text-caption">Hali to'lov qilinmagan</p>
          <div v-for="p in detail.payments" :key="p.id" class="d-flex justify-space-between text-body-2 py-1">
            <span>{{ dateText(p.paymentDate) }} · {{ paymentLabel(p.paymentType) }}<span v-if="p.note" class="text-caption text-medium-emphasis"> · {{ p.note }}</span></span>
            <strong>{{ money(p.amount) }}</strong>
          </div>
        </VCardText>
        <VCardText class="d-flex justify-end"><VBtn color="primary" @click="detailDialog = false">Yopish</VBtn></VCardText>
      </VCard>
    </VDialog>

    <!-- ═══════════════ YETKAZIB BERUVCHI QO'SHISH/TAHRIRLASH ═══════════════ -->
    <VDialog v-model="supplierDialog" max-width="420">
      <VCard :title="editingSupplierId ? 'Yetkazib beruvchini tahrirlash' : 'Yangi yetkazib beruvchi'">
        <VCardText>
          <AppTextField v-model="supplierForm.name" label="Nomi" class="mb-3" />
          <AppTextField v-model="supplierForm.phone" label="Telefon" class="mb-3" />
          <AppTextField v-model="supplierForm.note" label="Izoh" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="supplierDialog = false">Bekor qilish</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!supplierForm.name.trim()" @click="saveSupplier">Saqlash</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <DelateDialog v-model:delete-modal="deleteModal" @delete-element="confirmDeleteSupplier" />
  </div>
</template>

<script lang="ts" setup>
import { useFinanceStore } from '@/@core/stores/finance'
import { useToastStore } from '@/@core/stores/toast.store'
import { Supplier, SupplierDebt } from '@/interface/finance.interface'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const financeStore = useFinanceStore()
const toastStore = useToastStore()

const tab = ref<'debts' | 'suppliers'>('debts')
const saving = ref(false)

const paymentTypes = [
  { title: 'Naqd', value: 'cash' },
  { title: 'Karta', value: 'card' },
  { title: "O'tkazma", value: 'transfer' },
]
const statusOptions = [
  { title: 'Ochiq (qarz bor)', value: 'open' },
  { title: "To'langan", value: 'paid' },
  { title: 'Bekor qilingan', value: 'cancelled' },
]

const money = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v || 0)) + " so'm"
const dateText = (d: string) => (d ? d.slice(0, 10).split('-').reverse().join('.') : '')
const paymentLabel = (t: string) => paymentTypes.find(p => p.value === t)?.title ?? t
const statusLabel = (s: string) => statusOptions.find(o => o.value === s)?.title.split(' ')[0] ?? s
const statusColor = (s: string) => ({ open: 'error', paid: 'success', cancelled: 'grey' } as Record<string, string>)[s] ?? 'default'
const errText = (e: any) => e?.data?.message || e?.response?._data?.message || 'Xatolik'
const pad = (n: number) => String(n).padStart(2, '0')
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const isOverdue = (d: SupplierDebt) => d.status === 'open' && !!d.dueDate && d.dueDate.slice(0, 10) < today()

const totalPayable = computed(() => financeStore.suppliers.reduce((s, x) => s + x.payable, 0))

// ─────────────────────────── Yuklash ───────────────────────────
const debtsPage = ref(1)
const filters = reactive({ supplierId: null as number | null, status: null as string | null })

async function loadDebts(page: number = 1) {
  debtsPage.value = page
  try {
    await financeStore.fetchDebts(page, filters)
  } catch (e: any) {
    toastStore.error(errText(e))
  }
}

async function loadAll() {
  try {
    await Promise.all([financeStore.fetchSuppliers(), loadDebts(debtsPage.value)])
  } catch (e: any) {
    toastStore.error(errText(e))
  }
}

// ─────────────────────────── Yetkazib beruvchi ───────────────────────────
const supplierDialog = ref(false)
const editingSupplierId = ref<number | null>(null)
const supplierForm = reactive({ name: '', phone: '', note: '' })

function openSupplierDialog(s?: Supplier) {
  editingSupplierId.value = s?.id ?? null
  supplierForm.name = s?.name ?? ''
  supplierForm.phone = s?.phone ?? ''
  supplierForm.note = s?.note ?? ''
  supplierDialog.value = true
}

async function saveSupplier() {
  saving.value = true
  try {
    if (editingSupplierId.value) {
      await financeStore.updateSupplier(editingSupplierId.value, { ...supplierForm })
    } else {
      const created = await financeStore.createSupplier({ ...supplierForm })
      if (debtDialog.value) debtForm.supplierId = created.id
    }
    toastStore.success('Saqlandi')
    supplierDialog.value = false
    await financeStore.fetchSuppliers()
  } catch (e: any) {
    toastStore.error(errText(e))
  } finally {
    saving.value = false
  }
}

const deleteModal = ref(false)
const pendingSupplierId = ref<number | null>(null)
function askDeleteSupplier(id: number) {
  pendingSupplierId.value = id
  deleteModal.value = true
}
async function confirmDeleteSupplier() {
  if (!pendingSupplierId.value) return
  try {
    await financeStore.deleteSupplier(pendingSupplierId.value)
    toastStore.success("O'chirildi")
    deleteModal.value = false
    await financeStore.fetchSuppliers()
  } catch (e: any) {
    toastStore.error(errText(e))
    deleteModal.value = false
  }
}

// ─────────────────────────── Yangi xarid ───────────────────────────
const debtDialog = ref(false)
const debtForm = reactive({
  supplierId: null as number | null,
  amount: 0,
  paidAmount: 0,
  paymentType: 'cash',
  debtDate: today(),
  dueDate: '',
  note: '',
})
const debtRemaining = computed(() => Math.max((debtForm.amount || 0) - (debtForm.paidAmount || 0), 0))

function openDebtDialog() {
  debtForm.supplierId = filters.supplierId
  debtForm.amount = 0
  debtForm.paidAmount = 0
  debtForm.paymentType = 'cash'
  debtForm.debtDate = today()
  debtForm.dueDate = ''
  debtForm.note = ''
  debtDialog.value = true
}

async function saveDebt() {
  if (!debtForm.supplierId || !debtForm.amount) return
  saving.value = true
  try {
    await financeStore.createDebt({
      supplierId: debtForm.supplierId,
      amount: debtForm.amount,
      paidAmount: debtForm.paidAmount || 0,
      paymentType: debtForm.paymentType,
      debtDate: debtForm.debtDate || undefined,
      dueDate: debtForm.dueDate || undefined,
      note: debtForm.note || undefined,
    })
    toastStore.success('Xarid yozildi')
    debtDialog.value = false
    tab.value = 'debts'
    await loadAll()
  } catch (e: any) {
    toastStore.error(errText(e))
  } finally {
    saving.value = false
  }
}

// ─────────────────────────── To'lov ───────────────────────────
const paymentDialog = ref(false)
const payTarget = ref<SupplierDebt | null>(null)
const payForm = reactive({ amount: 0, paymentType: 'cash', paymentDate: today(), note: '' })

function openPayment(d: SupplierDebt) {
  payTarget.value = d
  payForm.amount = d.remainingAmount
  payForm.paymentType = 'cash'
  payForm.paymentDate = today()
  payForm.note = ''
  paymentDialog.value = true
}

async function savePayment() {
  if (!payTarget.value || !payForm.amount) return
  saving.value = true
  try {
    await financeStore.addDebtPayment(payTarget.value.id, {
      amount: payForm.amount,
      paymentType: payForm.paymentType,
      paymentDate: payForm.paymentDate || undefined,
      note: payForm.note || undefined,
    })
    toastStore.success("To'lov saqlandi")
    paymentDialog.value = false
    await loadAll()
  } catch (e: any) {
    toastStore.error(errText(e))
  } finally {
    saving.value = false
  }
}

// ─────────────────────────── Tafsilot / bekor qilish ───────────────────────────
const detailDialog = ref(false)
const detail = ref<SupplierDebt | null>(null)

async function cancelDebt(id: number) {
  try {
    await financeStore.cancelDebt(id)
    toastStore.success('Xarid bekor qilindi')
    await loadAll()
  } catch (e: any) {
    toastStore.error(errText(e))
  }
}

onMounted(loadAll)
</script>
