<template>
  <div>
    <!-- ═══════════════ SARLAVHA ═══════════════ -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-4">
      <h4 class="text-h4">Xarajatlar</h4>
      <div class="d-flex gap-2">
        <VBtn variant="tonal" prepend-icon="tabler-tags" @click="categoriesDialog = true">Kategoriyalar</VBtn>
        <VBtn color="primary" prepend-icon="tabler-plus" @click="openCreate">Xarajat qo'shish</VBtn>
      </div>
    </div>

    <!-- ═══════════════ DAVR ═══════════════ -->
    <div class="d-flex align-center flex-wrap gap-3 mb-4">
      <VBtnToggle v-model="period" color="primary" density="comfortable" mandatory @update:model-value="applyPeriod">
        <VBtn value="today">Bugun</VBtn>
        <VBtn value="week">Hafta</VBtn>
        <VBtn value="month">Oy</VBtn>
        <VBtn value="year">Yil</VBtn>
        <VBtn value="all">Hammasi</VBtn>
      </VBtnToggle>
      <AppTextField v-model="filters.dateFrom" type="date" label="Sanadan" density="compact" style="max-inline-size: 170px" @update:model-value="onCustomDate" />
      <AppTextField v-model="filters.dateTo" type="date" label="Sanagacha" density="compact" style="max-inline-size: 170px" @update:model-value="onCustomDate" />
    </div>

    <!-- ═══════════════ XULOSA ═══════════════ -->
    <VRow class="mb-4">
      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <div class="text-caption text-medium-emphasis">Jami xarajat</div>
            <div class="text-h5 text-error font-weight-bold">{{ money(expensesStore.summary?.total ?? 0) }}</div>
            <div class="text-caption text-medium-emphasis">{{ expensesStore.summary?.count ?? 0 }} ta yozuv</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="8">
        <VCard title="Kategoriyalar bo'yicha" class="h-100">
          <VCardText>
            <p v-if="!expensesStore.summary?.byCategory.length" class="text-medium-emphasis">Ma'lumot yo'q</p>
            <div
              v-for="c in expensesStore.summary?.byCategory ?? []"
              :key="c.categoryId"
              class="mb-2 cursor-pointer"
              @click="toggleCategoryFilter(c.categoryId)"
            >
              <div class="d-flex justify-space-between text-body-2 mb-1">
                <span :class="{ 'font-weight-bold': filters.categoryId === c.categoryId }">{{ c.name }}</span>
                <span>{{ money(c.total) }} <span class="text-medium-emphasis">({{ percent(c.total) }}%)</span></span>
              </div>
              <VProgressLinear
                :model-value="percent(c.total)"
                :color="c.color || 'primary'"
                height="8"
                rounded
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ═══════════════ RO'YXAT ═══════════════ -->
    <VCard>
      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppSelect
              v-model="filters.categoryId"
              :items="expensesStore.categories"
              item-title="name"
              item-value="id"
              label="Kategoriya"
              clearable
              @update:model-value="refresh(1)"
            />
          </VCol>
          <VCol cols="12" sm="4">
            <AppSelect
              v-model="filters.paymentType"
              :items="paymentTypes"
              item-title="title"
              item-value="value"
              label="To'lov turi"
              clearable
              @update:model-value="refresh(1)"
            />
          </VCol>
          <VCol cols="12" sm="4">
            <AppTextField v-model="filters.search" label="Izoh bo'yicha qidirish" clearable @update:model-value="debouncedRefresh" />
          </VCol>
        </VRow>
      </VCardText>

      <VTable>
        <thead>
          <tr>
            <th>Sana</th>
            <th>Kategoriya</th>
            <th>Izoh</th>
            <th>To'lov turi</th>
            <th class="text-end">Summa</th>
            <th>Kiritdi</th>
            <th style="width: 100px">Amallar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in expensesStore.expenses" :key="e.id">
            <td>{{ dateText(e.expenseDate) }}</td>
            <td>
              <VChip size="small" :color="e.category.color || undefined" variant="tonal">
                {{ e.category.name }}
              </VChip>
            </td>
            <td class="text-caption" style="max-inline-size: 260px">{{ e.note || '-' }}</td>
            <td>{{ paymentLabel(e.paymentType) }}</td>
            <td class="text-end font-weight-medium">{{ money(e.amount) }}</td>
            <td class="text-caption">{{ e.createdByName || '-' }}</td>
            <td>
              <IconBtn @click="openEdit(e)"><VIcon icon="tabler-edit" color="success" /></IconBtn>
              <IconBtn @click="askDelete(e.id)"><VIcon icon="tabler-trash" color="error" /></IconBtn>
            </td>
          </tr>
          <tr v-if="!expensesStore.expenses.length">
            <td colspan="7" class="text-center text-medium-emphasis py-6">Xarajatlar topilmadi</td>
          </tr>
        </tbody>
        <tfoot v-if="expensesStore.expenses.length">
          <tr>
            <td colspan="4" class="text-end font-weight-bold">Filtr bo'yicha jami:</td>
            <td class="text-end font-weight-bold text-error">{{ money(expensesStore.filteredTotal) }}</td>
            <td colspan="2" />
          </tr>
        </tfoot>
      </VTable>

      <div v-if="expensesStore.total > 0" class="d-flex justify-center pa-4">
        <VPagination
          v-model="page"
          :length="Math.max(Math.ceil(expensesStore.total / expensesStore.limit), 1)"
          :total-visible="6"
          @update:model-value="refresh"
        />
      </div>
    </VCard>

    <!-- ═══════════════ XARAJAT QO'SHISH / TAHRIRLASH ═══════════════ -->
    <VDialog v-model="expenseDialog" max-width="460">
      <VCard :title="editingId ? 'Xarajatni tahrirlash' : 'Yangi xarajat'">
        <VCardText>
          <AppSelect
            v-model="form.categoryId"
            :items="expensesStore.categories"
            item-title="name"
            item-value="id"
            label="Kategoriya"
            class="mb-3"
          />
          <AppTextField v-model.number="form.amount" type="number" label="Summa (so'm)" class="mb-3" @keydown.enter.prevent="save" />
          <AppTextField v-model="form.expenseDate" type="date" label="Sana" class="mb-3" />
          <AppSelect v-model="form.paymentType" :items="paymentTypes" item-title="title" item-value="value" label="To'lov turi" class="mb-3" />
          <AppTextField v-model="form.note" label="Izoh (ixtiyoriy)" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="expenseDialog = false">Bekor qilish</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!form.categoryId || !form.amount" @click="save">Saqlash</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ═══════════════ KATEGORIYALAR ═══════════════ -->
    <VDialog v-model="categoriesDialog" max-width="480" scrollable>
      <VCard title="Xarajat kategoriyalari">
        <VCardText>
          <div v-for="c in expensesStore.categories" :key="c.id" class="d-flex align-center gap-2 mb-2">
            <template v-if="editingCategoryId === c.id">
              <input v-model="categoryForm.color" type="color" class="cat-color" />
              <VTextField v-model="categoryForm.name" density="compact" hide-details @keydown.enter.prevent="saveCategory" />
              <VBtn size="small" color="primary" @click="saveCategory">OK</VBtn>
              <VBtn size="small" variant="text" @click="editingCategoryId = null">Bekor</VBtn>
            </template>
            <template v-else>
              <span class="cat-dot" :style="{ background: c.color || '#999' }" />
              <span class="flex-grow-1">{{ c.name }}</span>
              <IconBtn size="small" @click="startEditCategory(c)"><VIcon icon="tabler-edit" size="18" /></IconBtn>
              <IconBtn size="small" @click="removeCategory(c.id)"><VIcon icon="tabler-trash" size="18" color="error" /></IconBtn>
            </template>
          </div>

          <VDivider class="my-3" />
          <div class="d-flex align-center gap-2">
            <input v-model="newCategory.color" type="color" class="cat-color" />
            <VTextField v-model="newCategory.name" label="Yangi kategoriya" density="compact" hide-details @keydown.enter.prevent="addCategory" />
            <VBtn color="primary" :disabled="!newCategory.name.trim()" @click="addCategory">Qo'shish</VBtn>
          </div>
        </VCardText>
        <VCardText class="d-flex justify-end">
          <VBtn color="primary" @click="categoriesDialog = false">Yopish</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <DelateDialog v-model:delete-modal="deleteModal" @delete-element="confirmDelete" />
  </div>
</template>

<script lang="ts" setup>
import { useExpensesStore } from '@/@core/stores/expenses'
import { useToastStore } from '@/@core/stores/toast.store'
import { Expense, ExpenseCategory } from '@/interface/expense.interface'
import { useDebounceFn } from '@vueuse/core'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const expensesStore = useExpensesStore()
const toastStore = useToastStore()

const paymentTypes = [
  { title: 'Naqd', value: 'cash' },
  { title: 'Karta', value: 'card' },
  { title: "O'tkazma", value: 'transfer' },
]

const money = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v || 0)) + " so'm"
const paymentLabel = (t: string) => paymentTypes.find(p => p.value === t)?.title ?? t
const dateText = (d: string) => d.split('-').reverse().join('.')
const errText = (e: any) => e?.data?.message || e?.response?._data?.message || 'Xatolik'

// ─────────────────────────── Davr / filtrlar ───────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const period = ref<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('month')
const page = ref(1)
const filters = reactive({
  categoryId: null as number | null,
  paymentType: null as string | null,
  search: '',
  dateFrom: '',
  dateTo: '',
})

function rangeFor(p: string): { from: string; to: string } {
  const now = new Date()
  const today = ymd(now)
  if (p === 'today') return { from: today, to: today }
  if (p === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    return { from: ymd(d), to: today }
  }
  if (p === 'month') return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: today }
  if (p === 'year') return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: today }
  return { from: '', to: '' }
}

function applyPeriod() {
  const r = rangeFor(period.value)
  filters.dateFrom = r.from
  filters.dateTo = r.to
  refresh(1)
}

function onCustomDate() {
  period.value = 'custom' as any
  refresh(1)
}

function toggleCategoryFilter(id: number) {
  filters.categoryId = filters.categoryId === id ? null : id
  refresh(1)
}

const percent = (v: number) => {
  const total = expensesStore.summary?.total || 0
  return total ? Math.round((v / total) * 100) : 0
}

async function refresh(p: number = 1) {
  page.value = p
  try {
    await Promise.all([
      expensesStore.fetchExpenses(p, {
        categoryId: filters.categoryId,
        paymentType: filters.paymentType,
        search: filters.search || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      }),
      expensesStore.fetchSummary(filters.dateFrom || undefined, filters.dateTo || undefined),
    ])
  } catch (e: any) {
    toastStore.error(errText(e))
  }
}
const debouncedRefresh = useDebounceFn(() => refresh(1), 400)

// ─────────────────────────── Qo'shish / tahrirlash ───────────────────────────
const expenseDialog = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = reactive({ categoryId: null as number | null, amount: 0, expenseDate: ymd(new Date()), paymentType: 'cash', note: '' })

function openCreate() {
  editingId.value = null
  form.categoryId = filters.categoryId ?? null
  form.amount = 0
  form.expenseDate = ymd(new Date())
  form.paymentType = 'cash'
  form.note = ''
  expenseDialog.value = true
}

function openEdit(e: Expense) {
  editingId.value = e.id
  form.categoryId = e.category.id
  form.amount = e.amount
  form.expenseDate = e.expenseDate
  form.paymentType = e.paymentType
  form.note = e.note || ''
  expenseDialog.value = true
}

async function save() {
  if (!form.categoryId || !form.amount) return
  saving.value = true
  try {
    const payload = {
      categoryId: form.categoryId,
      amount: form.amount,
      expenseDate: form.expenseDate,
      paymentType: form.paymentType,
      note: form.note,
    }
    if (editingId.value) await expensesStore.updateExpense(editingId.value, payload)
    else await expensesStore.createExpense(payload)
    toastStore.success('Saqlandi')
    expenseDialog.value = false
    refresh(page.value)
  } catch (e: any) {
    toastStore.error(errText(e))
  } finally {
    saving.value = false
  }
}

// ─────────────────────────── O'chirish ───────────────────────────
const deleteModal = ref(false)
const pendingDeleteId = ref<number | null>(null)

function askDelete(id: number) {
  pendingDeleteId.value = id
  deleteModal.value = true
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  try {
    await expensesStore.deleteExpense(pendingDeleteId.value)
    toastStore.success("O'chirildi")
    deleteModal.value = false
    refresh(page.value)
  } catch (e: any) {
    toastStore.error(errText(e))
  }
}

// ─────────────────────────── Kategoriyalar ───────────────────────────
const categoriesDialog = ref(false)
const newCategory = reactive({ name: '', color: '#7367F0' })
const editingCategoryId = ref<number | null>(null)
const categoryForm = reactive({ name: '', color: '#7367F0' })

async function addCategory() {
  if (!newCategory.name.trim()) return
  try {
    await expensesStore.createCategory({ name: newCategory.name.trim(), color: newCategory.color })
    newCategory.name = ''
    await expensesStore.fetchCategories()
  } catch (e: any) {
    toastStore.error(errText(e))
  }
}

function startEditCategory(c: ExpenseCategory) {
  editingCategoryId.value = c.id
  categoryForm.name = c.name
  categoryForm.color = c.color || '#7367F0'
}

async function saveCategory() {
  if (!editingCategoryId.value) return
  try {
    await expensesStore.updateCategory(editingCategoryId.value, { name: categoryForm.name, color: categoryForm.color })
    editingCategoryId.value = null
    await expensesStore.fetchCategories()
    refresh(page.value)
  } catch (e: any) {
    toastStore.error(errText(e))
  }
}

async function removeCategory(id: number) {
  try {
    await expensesStore.deleteCategory(id)
    await expensesStore.fetchCategories()
    if (filters.categoryId === id) filters.categoryId = null
    toastStore.success("Kategoriya o'chirildi")
  } catch (e: any) {
    toastStore.error(errText(e)) // masalan: kategoriyada xarajatlar bor
  }
}

onMounted(async () => {
  try {
    await expensesStore.fetchCategories()
  } catch (e: any) {
    toastStore.error(errText(e))
  }
  applyPeriod()
})
</script>

<style lang="scss" scoped>
.cat-dot {
  inline-size: 14px;
  block-size: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-color {
  inline-size: 36px;
  block-size: 32px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
</style>
