<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
      <h4 class="text-h4">Statistika</h4>
      <VBtnToggle v-model="period" color="primary" density="comfortable" mandatory @update:model-value="load">
        <VBtn value="today">Bugun</VBtn>
        <VBtn value="week">Hafta</VBtn>
        <VBtn value="month">Oy</VBtn>
        <VBtn value="year">Yil</VBtn>
      </VBtnToggle>
    </div>

    <VProgressLinear v-if="statisticsStore.loading" indeterminate color="primary" class="mb-4" />

    <template v-if="dashboard">
      <!-- ═══════════════ XULOSA KARTALARI ═══════════════ -->
      <VRow class="mb-4">
        <VCol cols="6" sm="4" md="2">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis">Tushum</div>
              <div class="text-h6">{{ formatMoney(dashboard.totalRevenue) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis">Foyda</div>
              <div class="text-h6 text-success">{{ formatMoney(dashboard.totalProfit) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis">Cheklar soni</div>
              <div class="text-h6">{{ dashboard.totalOrders }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard>
            <VCardText>
              <div class="text-caption text-medium-emphasis">O'rtacha chek</div>
              <div class="text-h6">{{ formatMoney(dashboard.averageOrderValue) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard :color="dashboard.totalOutstandingDebt > 0 ? 'error' : undefined" :variant="dashboard.totalOutstandingDebt > 0 ? 'tonal' : 'elevated'">
            <VCardText>
              <div class="text-caption" :class="dashboard.totalOutstandingDebt > 0 ? '' : 'text-medium-emphasis'">Qarzdorlik</div>
              <div class="text-h6">{{ formatMoney(dashboard.totalOutstandingDebt) }}</div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="6" sm="4" md="2">
          <VCard :color="dashboard.lowStockCount + dashboard.outOfStockCount > 0 ? 'warning' : undefined" :variant="dashboard.lowStockCount + dashboard.outOfStockCount > 0 ? 'tonal' : 'elevated'">
            <VCardText>
              <div class="text-caption" :class="dashboard.lowStockCount + dashboard.outOfStockCount > 0 ? '' : 'text-medium-emphasis'">Kam/tugagan</div>
              <div class="text-h6">{{ dashboard.lowStockCount + dashboard.outOfStockCount }} ta</div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow class="mb-4">
        <!-- ═══════════════ KUNLIK TUSHUM GRAFIGI ═══════════════ -->
        <VCol cols="12" md="8">
          <VCard title="Kunlik tushum">
            <VCardText>
              <VueApexCharts
                v-if="revenueSeries[0]?.data?.length"
                type="area"
                height="300"
                :options="chartOptions"
                :series="revenueSeries"
              />
              <p v-else class="text-medium-emphasis text-center py-10">Ma'lumot yo'q</p>
            </VCardText>
          </VCard>
        </VCol>

        <!-- ═══════════════ TO'LOV TURLARI ═══════════════ -->
        <VCol cols="12" md="4">
          <VCard title="To'lov turlari bo'yicha" class="h-100">
            <VCardText>
              <div v-for="row in paymentRows" :key="row.label" class="mb-3">
                <div class="d-flex justify-space-between text-body-2 mb-1">
                  <span>{{ row.label }}</span>
                  <span class="font-weight-medium">{{ formatMoney(row.value) }}</span>
                </div>
                <VProgressLinear
                  :model-value="row.percent"
                  :color="row.color"
                  height="8"
                  rounded
                />
              </div>
              <p v-if="!paymentTotal" class="text-medium-emphasis text-center py-6">Ma'lumot yo'q</p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- ═══════════════ ENG KO'P SOTILGAN MAHSULOTLAR ═══════════════ -->
      <VCard title="Eng ko'p sotilgan mahsulotlar">
        <VTable>
          <thead>
            <tr>
              <th>#</th>
              <th>Mahsulot</th>
              <th class="text-end">Miqdor</th>
              <th class="text-end">Tushum</th>
              <th class="text-end">Foyda</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, idx) in dashboard.topProducts" :key="p.productId">
              <td>{{ idx + 1 }}</td>
              <td>{{ p.productName }}</td>
              <td class="text-end">{{ p.quantity }}</td>
              <td class="text-end">{{ formatMoney(p.revenue) }}</td>
              <td class="text-end text-success">{{ formatMoney(p.profit) }}</td>
            </tr>
            <tr v-if="!dashboard.topProducts.length">
              <td colspan="5" class="text-center text-medium-emphasis py-6">Ma'lumot yo'q</td>
            </tr>
          </tbody>
        </VTable>
      </VCard>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useStatisticsStore } from '@/@core/stores/statistics'
import { useToastStore } from '@/@core/stores/toast.store'
import VueApexCharts from 'vue3-apexcharts'

definePage({
  meta: {
    action: 'read',
    subject: 'SecondPage',
  },
})

const statisticsStore = useStatisticsStore()
const toastStore = useToastStore()

const period = ref<'today' | 'week' | 'month' | 'year'>('week')
const dashboard = computed(() => statisticsStore.dashboard)

async function load() {
  try {
    await statisticsStore.fetchDashboard(period.value)
  } catch (error: any) {
    toastStore.error(error?.data?.message || error?.response?._data?.message || 'Xatolik')
  }
}

const revenueSeries = computed(() => [
  {
    name: 'Tushum',
    data: (dashboard.value?.dailyRevenue ?? []).map(d => ({ x: d.date, y: d.revenue })),
  },
])

const chartOptions = computed(() => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  xaxis: { type: 'datetime' },
  yaxis: { labels: { formatter: (v: number) => formatMoney(v) } },
  tooltip: { y: { formatter: (v: number) => `${formatMoney(v)} so'm` } },
  colors: ['#7367F0'],
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 },
  },
}))

const paymentTotal = computed(() => {
  const r = dashboard.value?.revenueByPaymentType
  if (!r) return 0
  return r.cash + r.card + r.transfer + r.mixed
})

const paymentRows = computed(() => {
  const r = dashboard.value?.revenueByPaymentType
  if (!r) return []
  const total = paymentTotal.value || 1
  return [
    { label: 'Naqd', value: r.cash, color: 'success', percent: (r.cash / total) * 100 },
    { label: 'Karta', value: r.card, color: 'primary', percent: (r.card / total) * 100 },
    { label: "O'tkazma", value: r.transfer, color: 'info', percent: (r.transfer / total) * 100 },
    { label: 'Aralash', value: r.mixed, color: 'warning', percent: (r.mixed / total) * 100 },
  ]
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}

onMounted(load)
</script>
