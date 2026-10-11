import { ReceiptData, paymentTypeLabel } from '@/utils/receipt'
import { generateReceiptBarcode } from '@/utils/weightBarcode'

export interface PrinterSettings {
  shopName: string
  phone: string
  address: string
  footer: string
  paperWidth: 58 | 80
  // 'ascii'  — kirill harflar lotinga o'giriladi (har qanday printerda xavfsiz)
  // 'cp866'  — kirill harflar to'g'ridan-to'g'ri chop etiladi (printer kodlash
  //            jadvalini qo'llab-quvvatlashi kerak)
  encoding: 'ascii' | 'cp866'
  codepage: number // ESC t n — cp866 uchun odatda 17
  baudRate: number // faqat Serial ulanish uchun
}

export const defaultPrinterSettings: PrinterSettings = {
  shopName: "DO'KON",
  phone: '',
  address: '',
  footer: 'Xaridingiz uchun rahmat!',
  paperWidth: 58,
  encoding: 'ascii',
  codepage: 17,
  baudRate: 9600,
}

// ─────────────────────────── Matn kodlash ───────────────────────────
const CYR_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ў: "o'", қ: 'q', ғ: "g'", ҳ: 'h',
}

function translitCyrillic(ch: string): string | null {
  const lower = ch.toLowerCase()
  const lat = CYR_TO_LAT[lower]
  if (lat === undefined) return null
  return ch === lower ? lat : lat.charAt(0).toUpperCase() + lat.slice(1)
}

function cp866Byte(ch: string): number | null {
  const c = ch.charCodeAt(0)
  if (c >= 0x0410 && c <= 0x042f) return 0x80 + (c - 0x0410) // А-Я
  if (c >= 0x0430 && c <= 0x043f) return 0xa0 + (c - 0x0430) // а-п
  if (c >= 0x0440 && c <= 0x044f) return 0xe0 + (c - 0x0440) // р-я
  if (c === 0x0401) return 0xf0 // Ё
  if (c === 0x0451) return 0xf1 // ё
  return null
}

function normalizeText(text: string): string {
  return text
    .replace(/[\u02BB\u02BC\u2018\u2019\u00B4`]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00D7/g, 'x')
    .replace(/\u2116/g, 'N')
    .replace(/[\u00AB\u00BB\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u00A0\u2009\u202F]/g, ' ')
}

export function encodeText(text: string, encoding: 'ascii' | 'cp866'): number[] {
  const out: number[] = []
  for (const ch of normalizeText(text)) {
    const code = ch.charCodeAt(0)
    if (code >= 0x20 && code < 0x7f) {
      out.push(code)
      continue
    }
    if (code < 0x20) {
      out.push(0x20)
      continue
    }
    if (encoding === 'cp866') {
      const b = cp866Byte(ch)
      if (b !== null) {
        out.push(b)
        continue
      }
    }
    const lat = translitCyrillic(ch)
    if (lat !== null) {
      for (const c of lat) out.push(c.charCodeAt(0))
      continue
    }
    // Boshqa belgilar (diakritika va h.k.) — asosiy harfga
    const stripped = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (stripped && stripped.charCodeAt(0) < 0x7f && stripped.charCodeAt(0) >= 0x20) {
      out.push(stripped.charCodeAt(0))
    } else {
      out.push(0x3f) // ?
    }
  }
  return out
}

// ─────────────────────────── Quruvchi ───────────────────────────
class EscPosBuilder {
  private bytes: number[] = []

  constructor(private encoding: 'ascii' | 'cp866') {}

  raw(...b: number[]) {
    this.bytes.push(...b)
    return this
  }

  init(codepage: number) {
    this.raw(0x1b, 0x40) // ESC @
    if (this.encoding === 'cp866') this.raw(0x1b, 0x74, codepage) // ESC t n
    return this
  }

  align(n: 0 | 1 | 2) {
    return this.raw(0x1b, 0x61, n)
  }

  bold(on: boolean) {
    return this.raw(0x1b, 0x45, on ? 1 : 0)
  }

  // 0x00 — oddiy, 0x01 — balandligi 2x, 0x11 — kengligi va balandligi 2x
  size(n: number) {
    return this.raw(0x1d, 0x21, n)
  }

  text(s: string) {
    this.bytes.push(...encodeText(s, this.encoding))
    return this
  }

  line(s = '') {
    this.text(s)
    return this.raw(0x0a)
  }

  feed(n: number) {
    return this.raw(0x1b, 0x64, n)
  }

  cut() {
    return this.raw(0x1d, 0x56, 0x42, 0x03) // GS V 66 3 — qog'ozni surib kesish
  }

  barcodeEan13(digits13: string) {
    const digits12 = digits13.slice(0, 12)
    this.raw(0x1d, 0x68, 64) // balandlik
    this.raw(0x1d, 0x77, 2) // kenglik
    this.raw(0x1d, 0x48, 2) // raqamlar shtrix-kod ostida
    this.raw(0x1d, 0x66, 0) // HRI shrifti A
    this.raw(0x1d, 0x6b, 0x02) // GS k 2 (EAN13)
    for (const c of digits12) this.raw(c.charCodeAt(0))
    this.raw(0x00)
    return this
  }

  build(): Uint8Array {
    return new Uint8Array(this.bytes)
  }
}

// ─────────────────────────── Yordamchilar ───────────────────────────
const fmt = (n: number) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const fmtQty = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')

function wrap(text: string, width: number): string[] {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let w = word
    while (w.length > width) {
      if (current) {
        lines.push(current)
        current = ''
      }
      lines.push(w.slice(0, width))
      w = w.slice(width)
    }
    if (!current) current = w
    else if ((current + ' ' + w).length <= width) current += ' ' + w
    else {
      lines.push(current)
      current = w
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function leftRight(left: string, right: string, width: number): string {
  const space = width - left.length - right.length
  if (space >= 1) return left + ' '.repeat(space) + right
  return left.slice(0, Math.max(width - right.length - 1, 0)) + ' ' + right
}

// ─────────────────────────── Chek ───────────────────────────
export function buildReceiptBytes(receipt: ReceiptData, settings: PrinterSettings): Uint8Array {
  const W = settings.paperWidth === 80 ? 48 : 32
  const dash = '-'.repeat(W)
  const dbl = '='.repeat(W)
  const b = new EscPosBuilder(settings.encoding).init(settings.codepage)

  // Sarlavha
  b.align(1).bold(true).size(0x11)
  for (const l of wrap(settings.shopName || "DO'KON", Math.floor(W / 2))) b.line(l)
  b.size(0x00).bold(false)
  if (settings.address) for (const l of wrap(settings.address, W)) b.line(l)
  if (settings.phone) b.line('Tel: ' + settings.phone)
  b.align(0).line(dbl)

  // Chek ma'lumotlari
  b.line(leftRight(receipt.orderId ? `Chek: #${receipt.orderId}` : 'Chek: (yuborilmagan)', receipt.date, W))
  if (receipt.cashier) b.line('Kassir: ' + receipt.cashier)
  if (receipt.cancelled) {
    b.align(1).bold(true).line('*** BEKOR QILINGAN ***').bold(false).align(0)
  }
  b.line(dash)

  // Mahsulotlar
  for (const item of receipt.items) {
    for (const l of wrap(item.name, W)) b.line(l)
    const gross = item.total + item.discount
    b.line(leftRight(`${fmtQty(item.quantity)} x ${fmt(item.price)}`, fmt(gross), W))
    if (item.discount > 0) b.line(leftRight('  chegirma', '-' + fmt(item.discount), W))
  }
  b.line(dash)

  // Jami
  b.line(leftRight('Jami:', fmt(receipt.subtotal), W))
  if (receipt.discount > 0) b.line(leftRight('Chegirma:', '-' + fmt(receipt.discount), W))
  b.bold(true).size(0x01)
  b.line(leftRight("TO'LANADI:", fmt(receipt.total), W))
  b.size(0x00).bold(false)
  b.line(dash)

  // To'lov
  b.line(leftRight("To'lov turi:", paymentTypeLabel(receipt.paymentType), W))
  b.line(leftRight("To'landi:", fmt(receipt.paidAmount), W))
  if (receipt.debtAmount > 0) {
    b.bold(true).line(leftRight('QARZ:', fmt(receipt.debtAmount), W)).bold(false)
    if (receipt.customerName) for (const l of wrap('Mijoz: ' + receipt.customerName, W)) b.line(l)
  }
  b.line(dbl)

  // Shtrix-kod (chekni tez topish uchun)
  if (receipt.orderId) {
    try {
      b.align(1).feed(1).barcodeEan13(generateReceiptBarcode(receipt.orderId)).feed(1)
    } catch {
      // chek raqami juda katta bo'lsa — shtrix-kodsiz davom etamiz
    }
  }
  if (receipt.offline) {
    b.align(1).line('(oflayn chek - internet qaytganda yuboriladi)')
  }
  b.align(1)
  if (settings.footer) for (const l of wrap(settings.footer, W)) b.line(l)

  b.feed(4).cut()
  return b.build()
}

export function buildTestBytes(settings: PrinterSettings): Uint8Array {
  const W = settings.paperWidth === 80 ? 48 : 32
  const b = new EscPosBuilder(settings.encoding).init(settings.codepage)
  b.align(1).bold(true).size(0x11).line("SINOV CHEKI").size(0x00).bold(false)
  b.line('-'.repeat(W))
  b.align(0)
  b.line("Printer ishlayapti!")
  b.line(`Qog'oz: ${settings.paperWidth} mm (${W} belgi)`)
  b.line("Lotin: o' g' sh ch")
  b.line('Kirill: Привет Салом Ўзбек')
  b.line('-'.repeat(W))
  b.align(1).feed(1).barcodeEan13(generateReceiptBarcode(1234567)).feed(1)
  b.line('Agar kirill harflar notogri chiqsa,')
  b.line("sozlamalardan 'Faqat lotin'ni tanlang")
  b.feed(4).cut()
  return b.build()
}
