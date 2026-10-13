<template>
  <div v-if="receipt" class="receipt-wrap">
    <div class="receipt">
      <div class="receipt__head">
        <div class="receipt__shop">{{ settings.shopName || "DO'KON" }}</div>
        <div v-if="settings.address" class="receipt__muted">{{ settings.address }}</div>
        <div v-if="settings.phone" class="receipt__muted">Tel: {{ settings.phone }}</div>
      </div>

      <div class="receipt__rule receipt__rule--double" />

      <div class="receipt__row receipt__muted">
        <span>{{ receipt.orderId ? `Chek #${receipt.orderId}` : 'Chek (yuborilmagan)' }}</span>
        <span>{{ receipt.date }}</span>
      </div>
      <div v-if="receipt.cashier" class="receipt__muted">Kassir: {{ receipt.cashier }}</div>
      <div v-if="receipt.cancelled" class="receipt__stamp">BEKOR QILINGAN</div>
      <div v-if="receipt.offline" class="receipt__offline">
        Oflayn chek — internet qaytganda serverga yuboriladi
      </div>

      <div class="receipt__rule" />

      <div v-for="(item, i) in receipt.items" :key="i" class="receipt__item">
        <div class="receipt__item-name">{{ item.name }}</div>
        <div class="receipt__row">
          <span class="receipt__muted">{{ fmtQty(item.quantity) }}{{ item.unit ? ' ' + item.unit : '' }} × {{ fmt(item.price) }}</span>
          <span>{{ fmt(item.total + item.discount) }}</span>
        </div>
        <div v-if="item.discount > 0" class="receipt__row receipt__discount">
          <span>chegirma</span>
          <span>-{{ fmt(item.discount) }}</span>
        </div>
      </div>

      <div class="receipt__rule" />

      <div class="receipt__row">
        <span>Jami</span>
        <span>{{ fmt(receipt.subtotal) }}</span>
      </div>
      <div v-if="receipt.discount > 0" class="receipt__row receipt__discount">
        <span>Chegirma</span>
        <span>-{{ fmt(receipt.discount) }}</span>
      </div>
      <div class="receipt__row receipt__total">
        <span>TO'LANADI</span>
        <span>{{ fmt(receipt.total) }} so'm</span>
      </div>

      <div class="receipt__rule" />

      <div class="receipt__row">
        <span class="receipt__muted">To'lov turi</span>
        <span>{{ paymentTypeLabel(receipt.paymentType) }}</span>
      </div>
      <div class="receipt__row">
        <span class="receipt__muted">To'landi</span>
        <span>{{ fmt(receipt.paidAmount) }}</span>
      </div>
      <div v-if="receipt.debtAmount > 0" class="receipt__row receipt__debt">
        <span>QARZ</span>
        <span>{{ fmt(receipt.debtAmount) }}</span>
      </div>
      <div v-if="receipt.debtAmount > 0 && receipt.customerName" class="receipt__muted">
        Mijoz: {{ receipt.customerName }}
      </div>

      <div class="receipt__rule receipt__rule--double" />

      <div v-if="receipt.orderId" class="receipt__barcode-box">
        <svg ref="barcodeRef" />
      </div>

      <div v-if="settings.footer" class="receipt__footer">{{ settings.footer }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { usePrinter } from '@/composables/usePrinter'
import { ReceiptData, paymentTypeLabel } from '@/utils/receipt'
import { generateReceiptBarcode } from '@/utils/weightBarcode'
import JsBarcode from 'jsbarcode'

const props = defineProps<{ receipt: ReceiptData | null }>()

const { settings } = usePrinter()
const barcodeRef = ref<SVGElement | null>(null)

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n || 0))
const fmtQty = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')

function renderBarcode() {
  const id = props.receipt?.orderId
  if (!id || !barcodeRef.value) return
  try {
    JsBarcode(barcodeRef.value, generateReceiptBarcode(id), {
      format: 'EAN13',
      width: 1.8,
      height: 46,
      fontSize: 13,
      margin: 0,
      background: 'transparent',
    })
  } catch {
    // shtrix-kod chizib bo'lmasa — chek baribir ko'rinadi
  }
}

watch(
  () => props.receipt,
  () => nextTick(renderBarcode),
  { immediate: true, flush: 'post' },
)
onMounted(() => nextTick(renderBarcode))
</script>

<style lang="scss" scoped>
.receipt-wrap {
  padding-block-end: 14px;
}

.receipt {
  position: relative;
  max-inline-size: 320px;
  margin-inline: auto;
  padding: 18px 18px 14px;
  background: #fff;
  color: #222;
  font-family: 'Courier New', ui-monospace, monospace;
  font-size: 0.82rem;
  line-height: 1.45;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);

  // Qog'oz pastki qirrasi (tishli)
  &::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    inset-block-start: 100%;
    block-size: 8px;
    background:
      linear-gradient(135deg, #fff 6px, transparent 0) 0 0 / 12px 12px repeat-x,
      linear-gradient(225deg, #fff 6px, transparent 0) 0 0 / 12px 12px repeat-x;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.12));
  }

  &__head {
    text-align: center;
    margin-block-end: 8px;
  }

  &__shop {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  &__muted {
    color: #666;
    font-size: 0.76rem;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  &__rule {
    margin-block: 8px;
    border-block-start: 1px dashed #999;

    &--double {
      border-block-start: 3px double #777;
    }
  }

  &__item {
    margin-block-end: 6px;
  }

  &__item-name {
    font-weight: 700;
  }

  &__discount {
    color: #b3261e;
    font-size: 0.78rem;
  }

  &__total {
    margin-block-start: 4px;
    font-size: 1.05rem;
    font-weight: 800;
  }

  &__debt {
    color: #b3261e;
    font-weight: 800;
  }

  &__stamp {
    margin-block: 6px;
    padding: 2px 6px;
    border: 2px solid #b3261e;
    border-radius: 4px;
    color: #b3261e;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-align: center;
    transform: rotate(-3deg);
  }

  &__offline {
    margin-block-start: 4px;
    color: #9a6700;
    font-size: 0.74rem;
    text-align: center;
  }

  &__barcode-box {
    display: flex;
    justify-content: center;
    margin-block: 8px 4px;

    svg {
      max-inline-size: 100%;
    }
  }

  &__footer {
    margin-block-start: 6px;
    text-align: center;
    font-weight: 700;
  }
}
</style>
