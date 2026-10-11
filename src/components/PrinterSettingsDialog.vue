<template>
  <VDialog
    :model-value="modelValue"
    max-width="540"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard title="Printer sozlamalari">
      <VCardText>
        <!-- Ulanish holati -->
        <div class="d-flex align-center flex-wrap gap-2 mb-3">
          <VChip :color="connected ? 'success' : 'default'" size="small" variant="flat">
            <VIcon start :icon="connected ? 'tabler-printer' : 'tabler-printer-off'" size="14" />
            {{ connected ? `Ulangan: ${deviceLabel} (${mode === 'usb' ? 'USB' : 'Serial'})` : 'Printer ulanmagan' }}
          </VChip>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-3">
          <template v-if="!connected">
            <VBtn
              prepend-icon="tabler-usb"
              :disabled="!supportsUsb"
              :loading="connecting"
              @click="doConnect('usb')"
            >
              USB orqali ulash
            </VBtn>
            <VBtn
              variant="tonal"
              prepend-icon="tabler-plug-connected"
              :disabled="!supportsSerial"
              :loading="connecting"
              @click="doConnect('serial')"
            >
              Serial (COM / Bluetooth)
            </VBtn>
          </template>
          <template v-else>
            <VBtn variant="tonal" prepend-icon="tabler-printer" @click="doTest">Sinov cheki</VBtn>
            <VBtn variant="tonal" color="error" @click="disconnect">Uzish</VBtn>
          </template>
        </div>

        <VAlert
          v-if="!supportsUsb && !supportsSerial"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          Bu brauzer printerga to'g'ridan-to'g'ri ulanishni qo'llab-quvvatlamaydi.
          Chrome yoki Edge ishlating (sayt HTTPS yoki localhost'da bo'lishi shart).
        </VAlert>

        <VAlert type="info" variant="tonal" density="compact" class="mb-3 text-caption">
          Windows'da USB printerni brauzer ko'rishi uchun printerga <strong>WinUSB</strong>
          drayveri kerak bo'lishi mumkin (Zadig dasturi bilan bir marta o'rnatiladi). Agar
          USB ishlamasa — printer COM-port sifatida chiqsa <strong>Serial</strong> usulini
          tanlang. Ulanish bir marta ruxsat berilgach, keyingi safar avtomatik tiklanadi.
        </VAlert>

        <VDivider class="my-3" />

        <!-- Chek sarlavhasi / pastki matni -->
        <AppTextField v-model="settings.shopName" label="Do'kon nomi (chek tepasida)" class="mb-3" />
        <AppTextField v-model="settings.address" label="Manzil" class="mb-3" />
        <AppTextField v-model="settings.phone" label="Telefon" class="mb-3" />
        <AppTextField v-model="settings.footer" label="Chek pastidagi yozuv" class="mb-3" />

        <VRow dense>
          <VCol cols="6">
            <AppSelect
              v-model="settings.paperWidth"
              :items="paperOptions"
              item-title="title"
              item-value="value"
              label="Qog'oz kengligi"
            />
          </VCol>
          <VCol cols="6">
            <AppSelect
              v-model="settings.encoding"
              :items="encodingOptions"
              item-title="title"
              item-value="value"
              label="Harflar"
            />
          </VCol>
        </VRow>

        <AppTextField
          v-if="settings.encoding === 'cp866'"
          v-model.number="settings.codepage"
          type="number"
          label="Kodlash jadvali raqami (ESC t n, odatda 17)"
          class="mt-3"
        />
        <AppTextField
          v-if="!connected"
          v-model.number="settings.baudRate"
          type="number"
          label="Serial tezligi (baud, odatda 9600 yoki 115200)"
          class="mt-3"
        />
      </VCardText>

      <VCardText class="d-flex justify-end">
        <VBtn color="primary" @click="emit('update:modelValue', false)">Yopish</VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
import { useToastStore } from '@/@core/stores/toast.store'
import { usePrinter } from '@/composables/usePrinter'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const toastStore = useToastStore()
const {
  settings, connected, connecting, mode, deviceLabel, supportsUsb, supportsSerial,
  connectUsb, connectSerial, disconnect, printTest,
} = usePrinter()

const paperOptions = [
  { title: '58 mm', value: 58 },
  { title: '80 mm', value: 80 },
]
const encodingOptions = [
  { title: 'Faqat lotin (xavfsiz)', value: 'ascii' },
  { title: 'Kirill (CP866)', value: 'cp866' },
]

async function doConnect(kind: 'usb' | 'serial') {
  try {
    if (kind === 'usb') await connectUsb()
    else await connectSerial()
    toastStore.success('Printer ulandi')
  } catch (e: any) {
    toastStore.error(e?.message || 'Ulanib bo\'lmadi')
  }
}

async function doTest() {
  try {
    await printTest()
  } catch (e: any) {
    toastStore.error(e?.message || 'Chop etib bo\'lmadi')
  }
}
</script>
