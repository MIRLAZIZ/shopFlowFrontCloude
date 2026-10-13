// O'lchov birligi yordamchilari.
// Backend'da Unit: { name: "Kilogramm", label: "kg" } — chekda/savatda qisqa
// yozuv (label) ko'rsatiladi.

// Butun sonda sanaladigan birliklar (kasr miqdor bo'lishi mumkin emas)
const COUNT_UNITS = new Set([
  'dona', 'dn', 'ta', 'sht', 'pcs', 'pc', 'шт', 'дона', 'штук', 'комплект', 'to\'plam', 'toplam',
])

export function isCountUnit(label?: string | null): boolean {
  if (!label) return true // birlik noma'lum bo'lsa — dona deb hisoblaymiz
  return COUNT_UNITS.has(label.trim().toLowerCase().replace(/\.$/, ''))
}

export function unitLabelOf(product: { unit?: any } | null | undefined): string {
  const unit = product?.unit
  if (unit && typeof unit === 'object') return unit.label || unit.name || 'dona'
  return 'dona'
}
