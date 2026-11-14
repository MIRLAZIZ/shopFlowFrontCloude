export function round2(value: number) {
  return Math.round(value * 100) / 100
}

export function round3(value: number) {
  return Math.round(value * 1000) / 1000
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value || 0))
}

export function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export const paymentOptions = [
  { title: 'Naqd', value: 'cash' },
  { title: 'Karta', value: 'card' },
  { title: 'Aralash', value: 'mixed' },
]

export function paymentLabel(type: string) {
  return paymentOptions.find(p => p.value === type)?.title ?? type
}
