import * as XLSX from 'xlsx'
import { formatDate, formatINR, roomTypeLabel } from './formatters'

export function exportReportsExcel(bookings, dateRange) {
  const rows = bookings.map(b => ({
    'Guest Name': b.guests?.full_name,
    'Mobile': b.guests?.mobile,
    'Room': b.rooms?.room_number,
    'Room Type': roomTypeLabel(b.rooms?.room_type),
    'Check-in': formatDate(b.check_in_date),
    'Check-out': formatDate(b.check_out_date),
    'Rate/Night': b.custom_rate || b.rooms?.base_rate,
    'Room Total': b.total_room_amount,
    'Food Total': b.total_food_amount,
    'Grand Total': b.total_amount,
    'Deposit': b.deposit_amount,
    'Payment Status': b.payment_status,
    'Status': b.status,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
  XLSX.writeFile(wb, `report-${dateRange.from}-to-${dateRange.to}.xlsx`)
}
