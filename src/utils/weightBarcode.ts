// Vaznli mahsulotlar (piyoz, go'sht, un va h.k.) uchun shtrix-kod.
//
// EAN-13 formatida 13 xonali kod, ichki tuzilishi:
//   [2 xona prefiks "21"] [5 xona mahsulot ID] [5 xona vazn (gramm)] [1 xona tekshiruv raqami]
//
// "21" prefiksi EAN standartida ICHKI (do'kon darajasida) foydalanish
// uchun ajratilgan oraliqdan (20-29) olingan — haqiqiy global shtrix-kod
// bilan to'qnashmaydi.
//
// Masalan: Piyoz (mahsulot ID=42), 5 kg (5000 gramm) qadoqlansa:
//   21 | 00042 | 05000 | C  →  2100042050006 (oxirgi raqam — tekshiruv raqami)

const PREFIX = '21'

function ean13CheckDigit(digits12: string): number {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const d = Number(digits12[i])
    sum += i % 2 === 0 ? d : d * 3
  }
  return (10 - (sum % 10)) % 10
}

export function generateWeightBarcode(productId: number, weightGrams: number): string {
  if (productId <= 0 || productId > 99999) {
    throw new Error("Mahsulot ID 99999 dan oshmasligi kerak")
  }
  const grams = Math.round(weightGrams)
  if (grams <= 0 || grams > 99999) {
    throw new Error("Miqdor 0.001 dan 99.999 gacha bo'lishi kerak")
  }

  const productPart = String(productId).padStart(5, '0')
  const weightPart = String(grams).padStart(5, '0')
  const digits12 = PREFIX + productPart + weightPart
  const checkDigit = ean13CheckDigit(digits12)

  return digits12 + String(checkDigit)
}

export interface DecodedWeightBarcode {
  productId: number
  weightGrams: number
  weightKg: number
}

export function decodeWeightBarcode(code: string): DecodedWeightBarcode | null {
  if (!/^\d{13}$/.test(code)) return null
  if (!code.startsWith(PREFIX)) return null

  const digits12 = code.slice(0, 12)
  const checkDigit = Number(code[12])
  if (ean13CheckDigit(digits12) !== checkDigit) return null // soxta/buzilgan kod

  const productId = Number(code.slice(2, 7))
  const weightGrams = Number(code.slice(7, 12))

  return { productId, weightGrams, weightKg: weightGrams / 1000 }
}

// ─────────────────────────── CHEK shtrix-kodi ───────────────────────────
// Chek ostiga bosiladigan EAN-13: "22" + 10 xona chek raqami + tekshiruv raqami.
// Skanerlansa — chek darhol topiladi (qaytarish, ko'rish uchun). Mahsulot
// (prefiks 21) va tashqi shtrix-kodlar bilan to'qnashmaydi.
const RECEIPT_PREFIX = '22'

export function generateReceiptBarcode(orderId: number): string {
  if (!Number.isInteger(orderId) || orderId <= 0 || orderId > 9999999999) {
    throw new Error("Chek raqami noto'g'ri")
  }
  const digits12 = RECEIPT_PREFIX + String(orderId).padStart(10, '0')
  return digits12 + String(ean13CheckDigit(digits12))
}

export function decodeReceiptBarcode(code: string): number | null {
  if (!/^\d{13}$/.test(code)) return null
  if (!code.startsWith(RECEIPT_PREFIX)) return null
  if (ean13CheckDigit(code.slice(0, 12)) !== Number(code[12])) return null
  const id = Number(code.slice(2, 12))
  return id > 0 ? id : null
}

// ─────────────────────────── Birlikka bog'liq (umumiy) funksiyalar ───────────────────────────
// Kodda miqdor "mingdan bir" birlikda saqlanadi: kg → gramm, litr → millilitr,
// dona → 1 dona = 1000. Ya'ni kod HAR QANDAY o'lchov birligi uchun ishlaydi,
// mahsulotning o'z birligi (kg, litr, dona, metr...) qanday bo'lsa — shunda.
// Maksimal miqdor: 99.999 birlik.
export function generateQuantityBarcode(productId: number, quantity: number): string {
  return generateWeightBarcode(productId, Math.round(quantity * 1000))
}

export function decodeQuantityBarcode(code: string): { productId: number; quantity: number } | null {
  const d = decodeWeightBarcode(code)
  return d ? { productId: d.productId, quantity: d.weightGrams / 1000 } : null
}
