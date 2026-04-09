export function formatINR(amount) {
  if (amount == null || amount === '') return '₹0'
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  return formatDate(dateStr) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function maskAadhaar(num) {
  if (!num) return '—'
  const s = num.replace(/\s/g, '')
  if (s.length !== 12) return num
  return `XXXX-XXXX-${s.slice(8)}`
}

export function maskID(type, num) {
  if (!num) return '—'
  if (type === 'aadhaar') return maskAadhaar(num)
  return num
}

export function calcNights(checkIn, checkOut) {
  if (!checkIn) return 0
  const a = new Date(checkIn)
  const b = checkOut ? new Date(checkOut) : new Date()
  const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff)
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function toInputDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export function roomTypeLabel(type) {
  const map = {
    non_ac_standard: 'Non-AC Standard',
    non_ac_deluxe: 'Non-AC Deluxe',
    ac_standard: 'AC Standard',
    ac_deluxe: 'AC Deluxe',
  }
  return map[type] || type
}

export function mealTypeLabel(type) {
  const map = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
    other: 'Other',
  }
  return map[type] || type
}
