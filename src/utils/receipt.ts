import { Order } from '@/interface/order.interface'

// Chek uchun yagona ma'lumot tuzilmasi: ekrandagi ko'rinish (ReceiptPreview)
// ham, haqiqiy termoprinterga chiqarish (escpos.ts) ham SHUNDAN foydalanadi.

export interface ReceiptItem {
  name: string
  unit?: string | null // o'lchov birligi (kg, dona, litr...)
  quantity: number
  price: number
  discount: number // shu qator bo'yicha jami chegirma (so'm)
  total: number // chegirmadan keyingi summa
}

export interface ReceiptData {
  orderId: number | null // oflayn (hali yuborilmagan) chekda null
  date: string
  cashier?: string | null
  customerName?: string | null
  items: ReceiptItem[]
  subtotal: number
  discount: number
  total: number
  paidAmount: number
  debtAmount: number
  paymentType: string
  cancelled?: boolean
  offline?: boolean
}

const round2 = (v: number) => Math.round(v * 100) / 100
const round3 = (v: number) => Math.round(v * 1000) / 1000

export function formatReceiptDate(value: string | Date): string {
  const d = new Date(value)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function paymentTypeLabel(type: string): string {
  return ({ cash: 'Naqd', card: 'Karta', transfer: "O'tkazma", mixed: 'Aralash' } as Record<string, string>)[type] ?? type
}

// Serverdan kelgan chekdan. FIFO tufayli bitta mahsulot bir nechta
// qatorga bo'linishi mumkin — chekda bir xil narxdagilar birlashtiriladi.
export function receiptFromOrder(
  order: Order,
  opts: { cashier?: string | null; customerName?: string | null } = {},
): ReceiptData {
  const map = new Map<string, ReceiptItem>()
  for (const it of order.items ?? []) {
    const key = `${it.product?.id}_${it.selling_price}_${it.product?.unit ?? ''}`
    const existing = map.get(key)
    if (existing) {
      existing.quantity = round3(existing.quantity + it.quantity)
      existing.discount = round2(existing.discount + it.discount)
      existing.total = round2(existing.total + it.total)
    } else {
      map.set(key, {
        name: it.product?.name ?? '-',
        unit: it.product?.unit ?? null,
        quantity: it.quantity,
        price: it.selling_price,
        discount: it.discount,
        total: it.total,
      })
    }
  }

  return {
    orderId: order.id || null,
    date: formatReceiptDate(order.createdAt),
    cashier: order.user?.name ?? opts.cashier ?? null,
    customerName: opts.customerName ?? null,
    items: [...map.values()],
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    paidAmount: order.paidAmount,
    debtAmount: order.debtAmount,
    paymentType: order.paymentType,
    cancelled: order.status === 'cancelled',
  }
}

// Internet yo'q paytda (chek hali serverga yuborilmagan) savatdan.
export function receiptFromCart(params: {
  lines: { name: string; unit?: string | null; price: number; quantity: number; discount: number }[]
  overallDiscount: number
  paidAmount: number
  debtAmount: number
  paymentType: string
  cashier?: string | null
  customerName?: string | null
}): ReceiptData {
  const items: ReceiptItem[] = params.lines.map(l => ({
    name: l.name,
    unit: l.unit ?? null,
    quantity: l.quantity,
    price: l.price,
    discount: l.discount,
    total: round2(l.price * l.quantity - l.discount),
  }))
  const subtotal = round2(params.lines.reduce((s, l) => s + l.price * l.quantity, 0))
  const lineDiscounts = round2(params.lines.reduce((s, l) => s + l.discount, 0))
  const discount = round2(lineDiscounts + params.overallDiscount)

  return {
    orderId: null,
    date: formatReceiptDate(new Date()),
    cashier: params.cashier ?? null,
    customerName: params.customerName ?? null,
    items,
    subtotal,
    discount,
    total: round2(subtotal - discount),
    paidAmount: params.paidAmount,
    debtAmount: params.debtAmount,
    paymentType: params.paymentType,
    offline: true,
  }
}
