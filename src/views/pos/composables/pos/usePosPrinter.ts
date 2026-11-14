import { ref, type Ref } from 'vue'
import { useToastStore } from '@/@core/stores/toast.store'
import { usePrinter } from '@/composables/usePrinter'
import type { ReceiptData } from '@/utils/receipt'

export function usePosPrinter(receipt: Ref<ReceiptData | null>, printerDialog: Ref<boolean>) {
  const toastStore = useToastStore()
  const printing = ref(false)

  const {
    connected: printerConnected,
    autoPrint,
    printReceipt: sendToPrinter,
    tryReconnect: reconnectPrinter,
  } = usePrinter()

  // Haqiqiy termoprinterga chop etish (brauzer chop etish oynasisiz)
  async function runPrint(openSettingsIfMissing: boolean) {
    if (!receipt.value) return
    if (!printerConnected.value) {
      toastStore.error(
        openSettingsIfMissing ? 'Printer ulanmagan — sozlamalarni oching' : 'Chek chop etilmadi: printer ulanmagan',
      )
      if (openSettingsIfMissing) printerDialog.value = true
      return
    }
    printing.value = true
    try {
      await sendToPrinter(receipt.value)
    } catch (e: any) {
      toastStore.error(e?.message || "Chop etib bo'lmadi")
    } finally {
      printing.value = false
    }
  }

  const printCurrentReceipt = () => runPrint(true)

  return { printerConnected, autoPrint, printing, runPrint, printCurrentReceipt, reconnectPrinter }
}
