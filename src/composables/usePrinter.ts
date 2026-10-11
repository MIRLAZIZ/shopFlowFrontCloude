import { reactive, ref, watch } from 'vue'
import {
  PrinterSettings,
  buildReceiptBytes,
  buildTestBytes,
  defaultPrinterSettings,
} from '@/utils/escpos'
import { ReceiptData } from '@/utils/receipt'

// Haqiqiy termoprinterga (ESC/POS) brauzerdan to'g'ridan-to'g'ri chop etish —
// chop etish oynasisiz. Ikki usul:
//   • WebUSB   — USB orqali ulangan printer (Chrome/Edge, HTTPS yoki localhost)
//   • Web Serial — COM-port / Bluetooth-serial printer
// Ulanish bir marta ruxsat berilgach, keyingi safar avtomatik tiklanadi.

const SETTINGS_KEY = 'shopflow-printer-settings'
const CONN_KEY = 'shopflow-printer-connection'
const AUTOPRINT_KEY = 'shopflow-auto-print'

function loadSettings(): PrinterSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return { ...defaultPrinterSettings, ...(raw ? JSON.parse(raw) : {}) }
  } catch {
    return { ...defaultPrinterSettings }
  }
}

const settings = reactive<PrinterSettings>(loadSettings())
watch(settings, v => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(v))
  } catch { /* localStorage mavjud emas */ }
}, { deep: true })

const connected = ref(false)
const connecting = ref(false)
const mode = ref<'usb' | 'serial' | null>(null)
const deviceLabel = ref('')
const lastError = ref('')

const autoPrint = ref(localStorage.getItem(AUTOPRINT_KEY) === '1')
watch(autoPrint, v => {
  try {
    localStorage.setItem(AUTOPRINT_KEY, v ? '1' : '0')
  } catch { /* e'tiborsiz */ }
})

let usbDevice: any = null
let usbEndpoint = 0
let serialPort: any = null

const nav = navigator as any
const supportsUsb = !!nav.usb
const supportsSerial = !!nav.serial

if (supportsUsb) {
  nav.usb.addEventListener('disconnect', (e: any) => {
    if (usbDevice && e.device === usbDevice) markDisconnected()
  })
}

function markDisconnected() {
  usbDevice = null
  serialPort = null
  connected.value = false
  mode.value = null
  deviceLabel.value = ''
}

function friendlyError(e: any): string {
  const msg = String(e?.message || e)
  if (e?.name === 'NotFoundError') return 'Qurilma tanlanmadi'
  if (/claim|access denied|denied/i.test(msg)) {
    return "Printerga kirib bo'lmadi. Windows'da printer drayveri USB'ni band qilgan bo'lishi mumkin — Zadig dasturi bilan printerga WinUSB drayverini o'rnating, yoki Serial (COM) usulini sinang."
  }
  return msg
}

// ─────────────────────────── USB ───────────────────────────
async function openUsb(device: any) {
  if (!device.opened) await device.open()
  if (device.configuration === null) await device.selectConfiguration(1)

  let found: { iface: number; alt: number; ep: number } | null = null
  for (const iface of device.configuration.interfaces) {
    for (const alt of iface.alternates) {
      const ep = alt.endpoints.find((x: any) => x.direction === 'out' && x.type === 'bulk')
      if (ep) {
        found = { iface: iface.interfaceNumber, alt: alt.alternateSetting, ep: ep.endpointNumber }
        break
      }
    }
    if (found) break
  }
  if (!found) throw new Error("Printerda ma'lumot qabul qiluvchi (bulk OUT) endpoint topilmadi")

  await device.claimInterface(found.iface)
  if (found.alt !== 0) await device.selectAlternateInterface(found.iface, found.alt)

  usbDevice = device
  usbEndpoint = found.ep
  mode.value = 'usb'
  connected.value = true
  deviceLabel.value =
    device.productName || `USB ${device.vendorId.toString(16)}:${device.productId.toString(16)}`
}

async function connectUsb() {
  if (!supportsUsb) {
    throw new Error("Bu brauzer WebUSB'ni qo'llab-quvvatlamaydi. Chrome yoki Edge ishlating (sayt HTTPS yoki localhost'da bo'lishi kerak).")
  }
  connecting.value = true
  lastError.value = ''
  try {
    const device = await nav.usb.requestDevice({ filters: [] })
    await openUsb(device)
    localStorage.setItem(CONN_KEY, JSON.stringify({ mode: 'usb', vendorId: device.vendorId, productId: device.productId }))
  } catch (e: any) {
    lastError.value = friendlyError(e)
    throw new Error(lastError.value)
  } finally {
    connecting.value = false
  }
}

// ─────────────────────────── Serial ───────────────────────────
async function openSerial(port: any) {
  await port.open({ baudRate: settings.baudRate || 9600 })
  serialPort = port
  mode.value = 'serial'
  connected.value = true
  const info = port.getInfo?.() ?? {}
  deviceLabel.value = info.usbVendorId
    ? `Serial ${info.usbVendorId.toString(16)}:${(info.usbProductId ?? 0).toString(16)}`
    : 'Serial port'
}

async function connectSerial() {
  if (!supportsSerial) {
    throw new Error("Bu brauzer Web Serial'ni qo'llab-quvvatlamaydi. Chrome yoki Edge ishlating.")
  }
  connecting.value = true
  lastError.value = ''
  try {
    const port = await nav.serial.requestPort()
    await openSerial(port)
    localStorage.setItem(CONN_KEY, JSON.stringify({ mode: 'serial' }))
  } catch (e: any) {
    lastError.value = friendlyError(e)
    throw new Error(lastError.value)
  } finally {
    connecting.value = false
  }
}

// Avval ruxsat berilgan printerni jimgina qayta ulash
async function tryReconnect() {
  if (connected.value) return
  try {
    const saved = JSON.parse(localStorage.getItem(CONN_KEY) || 'null')
    if (!saved) return
    if (saved.mode === 'usb' && supportsUsb) {
      const devices = await nav.usb.getDevices()
      const d = devices.find((x: any) => x.vendorId === saved.vendorId && x.productId === saved.productId)
      if (d) await openUsb(d)
    } else if (saved.mode === 'serial' && supportsSerial) {
      const ports = await nav.serial.getPorts()
      if (ports[0]) await openSerial(ports[0])
    }
  } catch {
    // jim — foydalanuvchi sozlamalardan qo'lda ulaydi
  }
}

async function disconnect() {
  try {
    if (mode.value === 'usb' && usbDevice) await usbDevice.close()
    else if (serialPort) await serialPort.close()
  } catch { /* e'tiborsiz */ }
  markDisconnected()
  localStorage.removeItem(CONN_KEY)
}

// ─────────────────────────── Chop etish ───────────────────────────
async function printBytes(bytes: Uint8Array) {
  if (!connected.value) throw new Error('Printer ulanmagan')
  try {
    if (mode.value === 'usb') {
      const CHUNK = 4096
      for (let i = 0; i < bytes.length; i += CHUNK) {
        await usbDevice.transferOut(usbEndpoint, bytes.slice(i, i + CHUNK))
      }
    } else {
      const writer = serialPort.writable.getWriter()
      try {
        await writer.write(bytes)
      } finally {
        writer.releaseLock()
      }
    }
  } catch (e: any) {
    markDisconnected()
    throw new Error("Printerga yuborib bo'lmadi (ulanish uzilgan bo'lishi mumkin): " + (e?.message || e))
  }
}

async function printReceipt(receipt: ReceiptData) {
  await printBytes(buildReceiptBytes(receipt, settings))
}

async function printTest() {
  await printBytes(buildTestBytes(settings))
}

export function usePrinter() {
  return {
    settings,
    connected,
    connecting,
    mode,
    deviceLabel,
    lastError,
    autoPrint,
    supportsUsb,
    supportsSerial,
    connectUsb,
    connectSerial,
    tryReconnect,
    disconnect,
    printReceipt,
    printTest,
  }
}
