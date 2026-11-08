<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-3">
      <div>
        <h5 class="text-h5">Aylanma aktivlar</h5>
        <div class="text-caption text-medium-emphasis">Hozirgi holat · tannarx bo'yicha</div>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <VBtn size="small" variant="tonal" prepend-icon="tabler-settings-dollar" @click="openOpening">
          Boshlang'ich qoldiq
        </VBtn>
        <VBtn size="small" variant="tonal" prepend-icon="tabler-arrows-exchange" @click="openMovements">
          Pul harakati
        </VBtn>
        <VBtn size="small" variant="tonal" prepend-icon="tabler-truck" @click="router.push('/suppliers')">
          Yetkazib beruvchilar
        </VBtn>
      </div>
    </div>

    <VProgressLinear v-if="loading" indeterminate color="primary" class="mb-3" />

    <VAlert
      v-if="report && !report.opening"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      Naqd pul va bank qoldig'i hozircha <strong>0 dan</strong> hisoblanmoqda. To'g'ri natija uchun
      <strong>"Boshlang'ich qoldiq"</strong> tugmasi orqali tizimdan foydalanishni boshlagan sanadagi
      naqd va bank/karta mablag'ini kiriting.
    </VAlert>

    <template v-if="report">
      <VRow class="mb-2">
        <!-- AKTIVLAR -->
        <VCol cols="12" md="8">
          <VRow>
            <VCol cols="12" sm="6">
              <VCard height="100%">
                <VCardText>
                  <div class="d-flex align-center gap-2 mb-1">
                    <VIcon icon="tabler-box" color="primary" />
                    <span class="text-caption text-medium-emphasis">Mahsulot (tannarx bo'yicha)</span>
                  </div>
                  <div class="text-h5 font-weight-bold">{{ money(report.assets.inventory.cost) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ report.assets.inventory.products }} xil mahsulot · sotuv narxida
                    {{ money(report.assets.inventory.retail) }}
                  </div>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6">
              <VCard height="100%">
                <VCardText>
                  <div class="d-flex align-center gap-2 mb-1">
                    <VIcon icon="tabler-cash" color="success" />
                    <span class="text-caption text-medium-emphasis">Naqd pul</span>
                  </div>
                  <div class="text-h5 font-weight-bold" :class="{ 'text-error': report.assets.cash.balance < 0 }">
                    {{ money(report.assets.cash.balance) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Kassadagi naqd</div>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6">
              <VCard height="100%">
                <VCardText>
                  <div class="d-flex align-center gap-2 mb-1">
                    <VIcon icon="tabler-credit-card" color="info" />
                    <span class="text-caption text-medium-emphasis">Bank / karta hisobi</span>
                  </div>
                  <div class="text-h5 font-weight-bold" :class="{ 'text-error': report.assets.bank.balance < 0 }">
                    {{ money(report.assets.bank.balance) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Karta va o'tkazmalar</div>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" sm="6">
              <VCard height="100%">
                <VCardText>
                  <div class="d-flex align-center gap-2 mb-1">
                    <VIcon icon="tabler-user-dollar" color="warning" />
                    <span class="text-caption text-medium-emphasis">Qarz (mijozlar bizga qarzdor)</span>
                  </div>
                  <div class="text-h5 font-weight-bold">{{ money(report.assets.receivables.total) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    Debitorlik · {{ report.assets.receivables.customers }} ta mijoz
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCol>

        <!-- TARKIB (donut) -->
        <VCol cols="12" md="4">
          <VCard height="100%">
            <VCardText>
              <div class="text-caption text-medium-emphasis mb-1">Aktivlar tarkibi</div>
              <VueApexCharts
                v-if="donutSeries.some(v => v > 0)"
                type="donut"
                height="210"
                :options="donutOptions"
                :series="donutSeries"
              />
              <p v-else class="text-medium-emphasis text-center py-8">Ma'lumot yo'q</p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- JAMI / MAJBURIYAT / SOF -->
      <VRow class="mb-2">
        <VCol cols="12" sm="4">
          <VCard color="primary" variant="tonal">
            <VCardText>
              <div class="text-caption">Jami aylanma aktivlar</div>
              <div class="text-h5 font-weight-bold">{{ money(report.assets.totalCurrent) }}</div>
              <div class="text-caption">mahsulot + naqd + bank + mijozlar qarzi</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard color="error" variant="tonal">
            <VCardText>
              <div class="text-caption">Yetkazib beruvchilarga qarz (majburiyat)</div>
              <div class="text-h5 font-weight-bold">− {{ money(report.liabilities.payables.total) }}</div>
              <div class="text-caption">
                Kreditorlik · {{ report.liabilities.payables.suppliers }} ta yetkazib beruvchi
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard :color="report.netAssets >= 0 ? 'success' : 'error'" variant="tonal">
            <VCardText>
              <div class="text-caption">Sof aktivlar</div>
              <div class="text-h5 font-weight-bold">{{ money(report.netAssets) }}</div>
              <div class="text-caption">aktivlar − majburiyatlar</div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VAlert type="info" variant="tonal" density="compact" class="mb-3 text-caption">
        Mahsulot yetkazib beruvchidan <strong>qarzga</strong> olinsa, u omborda turgani uchun
        "Mahsulot" aktivida hisoblanadi, lekin to'lanmagan qismi <strong>majburiyat</strong> sifatida
        ayrilib, <strong>sof aktivlar</strong>da hisobga olinadi. Bunday xaridni
        <a class="cursor-pointer text-primary" @click="router.push('/suppliers')">Yetkazib beruvchilar</a>
        bo'limida yozing.
      </VAlert>

      <!-- Pul qanday hisoblandi -->
      <VExpansionPanels variant="accordion">
        <VExpansionPanel title="Pul qoldig'i qanday hisoblandi?">
          <VExpansionPanelText>
            <p v-if="report.opening" class="text-caption text-medium-emphasis mb-2">
              {{ dateText(report.opening.startDate) }} dan boshlab hisoblangan
            </p>
            <VTable density="compact">
              <thead>
                <tr>
                  <th />
                  <th class="text-end">Naqd</th>
                  <th class="text-end">Bank / karta</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in breakdownRows" :key="row.label">
                  <td>{{ row.label }}</td>
                  <td class="text-end" :class="row.cls">{{ signed(row.cash, row.sign) }}</td>
                  <td class="text-end" :class="row.cls">{{ signed(row.bank, row.sign) }}</td>
                </tr>
                <tr class="font-weight-bold">
                  <td>Qoldiq</td>
                  <td class="text-end">{{ money(report.assets.cash.balance) }}</td>
                  <td class="text-end">{{ money(report.assets.bank.balance) }}</td>
                </tr>
              </tbody>
            </VTable>
            <p class="text-caption text-medium-emphasis mt-2 mb-0">
              Eslatma: mahsulotni naqd pulga sotib olgan bo'lsangiz, buni "Yetkazib beruvchilar → Yangi xarid"
              (to'langan summa bilan) yoki "Pul harakati" orqali yozing — aks holda pul qoldig'i
              haqiqatdan ko'proq ko'rinadi.
            </p>
          </VExpansionPanelText>
        </VExpansionPanel>
      </VExpansionPanels>
    </template>

    <!-- ═══════════════ BOSHLANG'ICH QOLDIQ ═══════════════ -->
    <VDialog v-model="openingDialog" max-width="440">
      <VCard title="Boshlang'ich qoldiq">
        <VCardText>
          <p class="text-body-2 text-medium-emphasis mb-3">
            Tizimdan foydalanishni boshlagan sanadagi pul miqdori. Shu sanadan keyingi savdo, xarajat va
            to'lovlar avtomatik qo'shib/ayirib boriladi.
          </p>
          <AppTextField v-model="openingForm.startDate" type="date" label="Boshlang'ich sana" class="mb-3" />
          <AppTextField v-model.number="openingForm.openingCash" type="number" label="Naqd pul (so'm)" class="mb-3" />
          <AppTextField v-model.number="openingForm.openingBank" type="number" label="Bank / karta hisobi (so'm)" />
        </VCardText>
        <VCardText class="d-flex justify-end gap-2">
          <VBtn variant="tonal" @click="openingDialog = false">Bekor qilish</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!openingForm.startDate" @click="saveOpening">Saqlash</VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ═══════════════ PUL HARAKATI ═══════════════ -->
    <VDialog v-model="movementsDialog" max-width="560" scrollable>
      <VCard title="Pul harakati (qo'lda)">
        <VCardText>
          <p class="text-body-2 text-medium-emphasis mb-3">
            Kapital kiritish, egasi pul olishi, tizimda yozilmagan to'lovlar va tuzatishlar uchun.
          </p>
          <VRow dense>
            <VCol cols="12" sm="4">
              <AppSelect v-model="moveForm.account" :items="accountOptions" item-title="title" item-value="value" label="Hisob" />
            </VCol>
            <VCol cols="12" sm="4">
              <AppSelect v-model="moveForm.direction" :items="directionOptions" item-title="title" item-value="value" label="Turi" />
            </VCol>
            <VCol cols="12" sm="4">
              <AppTextField v-model.number="moveForm.amount" type="number" label="Summa" />
            </VCol>
            <VCol cols="12" sm="4">
              <AppTextField v-model="moveForm.adjustmentDate" type="date" label="Sana" />
            </VCol>
            <VCol cols="12" sm="8">
              <AppTextField v-model="moveForm.note" label="Izoh" />
            </VCol>
          </VRow>
          <VBtn color="primary" class="mt-3" :loading="saving" :disabled="!moveForm.amount" @click="addMovement">
            Qo'shish
          </VBtn>

          <VDivider class="my-4" />
          <p v-if="!financeStore.adjustments.length" class="text-medium-emphasis text-center">Yozuvlar yo'q</p>
          <div v-for="a in financeStore.adjustments" :key="a.id" class="d-flex align-center justify-space-between py-1">
            <div>
              <div class="text-body-2">
                <VChip size="x-small" class="mr-1">{{ a.account === 'cash' ? 'Naqd' : 'Bank' }}</VChip>
                <span :class="a.amount >= 0 ? 'text-success' : 'text-error'" class="font-weight-medium">
                  {{ a.amount >= 0 ? '+' : '' }}{{ money(a.amount) }}
                </span>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ dateText(a.adjustmentDate) }}{{ a.note ? ' · ' + a.note : '' }}
              </div>
            </div>
            <IconBtn size="small" @click="removeMovement(a.id)"><VIcon icon="tabler-trash" color="error" size="18" /></IconBtn>
          </div>
        </VCardText>
        <VCardText class="d-flex justify-end">
          <VBtn color="primary" @click="movementsDialog = false">Yopish</VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script lang="ts" setup>
import { useFinanceStore } from '@/@core/stores/finance'
import { useToastStore } from '@/@core/stores/toast.store'
import { AssetsReport } from '@/interface/finance.interface'
import { useRouter } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'

const router = useRouter()
const financeStore = useFinanceStore()
const toastStore = useToastStore()

const loading = ref(false)
const saving = ref(false)
const report = computed<AssetsReport | null>(() => financeStore.assets)

const money = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v || 0)) + " so'm"
const dateText = (d: string) => (d ? d.slice(0, 10).split('-').reverse().join('.') : '')
const errText = (e: any) => e?.data?.message || e?.response?._data?.message || 'Xatolik'
const pad = (n: number) => String(n).padStart(2, '0')
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function load() {
  loading.value = true
  try {
    await financeStore.fetchAssets()
  } catch (e: any) {
    toastStore.error(errText(e))
  } finally {
    loading.value = false
  }
}

// ─────────────────────────── Tarkib (donut) ───────────────────────────
const donutLabels = ['Mahsulot', 'Naqd pul', 'Bank / karta', 'Mijozlar qarzi']
const donutSeries = computed(() => {
  const a = report.value?.assets
  if (!a) return []
  // Manfiy qoldiq diagrammada ko'rsatilmaydi (0 deb olinadi)
  return [a.inventory.cost, a.cash.balance, a.bank.balance, a.receivables.total].map(v => Math.max(Math.round(v), 0))
})
const donutOptions = computed(() => ({
  labels: donutLabels,
  colors: ['#7367F0', '#28C76F', '#00CFE8', '#FF9F43'],
  legend: { position: 'bottom', fontSize: '12px' },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (v: number) => money(v) } },
  plotOptions: { pie: { donut: { size: '62%' } } },
}))

// ─────────────────────────── Pul hisoblash jadvali ───────────────────────────
const signed = (v: number, sign: '+' | '−' | '') => (sign === '' ? money(v) : `${sign} ${money(Math.abs(v))}`)
const breakdownRows = computed(() => {
  const c = report.value?.assets.cash
  const b = report.value?.assets.bank
  if (!c || !b) return []
  return [
    { label: "Boshlang'ich qoldiq", cash: c.opening, bank: b.opening, sign: '' as const, cls: '' },
    { label: 'Savdodan tushgan', cash: c.salesIn, bank: b.salesIn, sign: '+' as const, cls: 'text-success' },
    { label: "Mijozlar qarz to'lovlari", cash: c.debtPaymentsIn, bank: b.debtPaymentsIn, sign: '+' as const, cls: 'text-success' },
    { label: "Qo'lda pul harakati (sof)", cash: c.adjustments, bank: b.adjustments, sign: '' as const, cls: '' },
    { label: 'Xarajatlar', cash: c.expensesOut, bank: b.expensesOut, sign: '−' as const, cls: 'text-error' },
    { label: "Yetkazib beruvchilarga to'lov", cash: c.suppliersOut, bank: b.suppliersOut, sign: '−' as const, cls: 'text-error' },
    { label: 'Qaytarishlar (mijozga qaytarilgan pul)', cash: c.returnsOut, bank: b.returnsOut, sign: '−' as const, cls: 'text-error' },
  ]
})

// ─────────────────────────── Boshlang'ich qoldiq ───────────────────────────
const openingDialog = ref(false)
const openingForm = reactive({ startDate: today(), openingCash: 0, openingBank: 0 })

function openOpening() {
  const o = report.value?.opening
  openingForm.startDate = o?.startDate?.slice(0, 10) || today()
  openingForm.openingCash = o?.openingCash ?? 0
  openingForm.openingBank = o?.openingBank ?? 0
  openingDialog.value = true
}

async function saveOpening() {
  saving.value = true
  try {
    await financeStore.setOpening({ ...openingForm })
    toastStore.success('Saqlandi')
    openingDialog.value = false
    await load()
  } catch (e: any) {
    toastStore.error(errText(e))
  } finally {
    saving.value = false
  }
}

// ─────────────────────────── Pul harakati ───────────────────────────
const movementsDialog = ref(false)
const accountOptions = [
  { title: 'Naqd', value: 'cash' },
  { title: 'Bank / karta', value: 'bank' },
]
const directionOptions = [
  { title: 'Kirim (+)', value: 'in' },
  { title: 'Chiqim (−)', value: 'out' },
]
const moveForm = reactive({ account: 'cash', direction: 'in', amount: 0, adjustmentDate: today(), note: '' })

async function openMovements() {
  moveForm.amount = 0
  moveForm.note = ''
  moveForm.adjustmentDate = today()
  movementsDialog.value = true
  try {
    await financeStore.fetchAdjustments(1)
  } catch (e: any) {
    toastStore.error(errText(e))
  }
}

async function addMovement() {
  if (!moveForm.amount) return
  saving.value = true
  try {
    await financeStore.createAdjustment({
      account: moveForm.account,
      amount: moveForm.direction === 'out' ? -Math.abs(moveForm.amount) : Math.abs(moveForm.amount),
      adjustmentDate: moveForm.adjustmentDate,
      note: moveForm.note || undefined,
    })
    toastStore.success("Qo'shildi")
    moveForm.amount = 0
    moveForm.note = ''
    await Promise.all([financeStore.fetchAdjustments(1), load()])
  } catch (e: any) {
    toastStore.error(errText(e))
  } finally {
    saving.value = false
  }
}

async function removeMovement(id: number) {
  try {
    await financeStore.deleteAdjustment(id)
    await Promise.all([financeStore.fetchAdjustments(1), load()])
  } catch (e: any) {
    toastStore.error(errText(e))
  }
}

onMounted(load)
defineExpose({ reload: load })
</script>
