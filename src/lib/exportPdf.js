import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatDate, formatINR, roomTypeLabel, calcNights } from './formatters'

export function exportGuestPDF(guest, bookings) {
  const doc = new jsPDF()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Natural Heaven', 14, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Bondarwadi, Mahabaleshwar', 14, 27)
  doc.line(14, 31, 196, 31)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Guest Record', 14, 40)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const details = [
    ['Name', guest.full_name],
    ['Mobile', guest.mobile],
    ['Address', `${guest.address}${guest.city ? ', ' + guest.city : ''}${guest.state ? ', ' + guest.state : ''}`],
    ['ID Type', guest.id_type?.toUpperCase()],
    ['ID Number', guest.id_number],
  ]
  doc.autoTable({
    startY: 45,
    head: [],
    body: details,
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    styles: { fontSize: 10 },
    theme: 'plain',
  })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Booking History', 14, doc.lastAutoTable.finalY + 10)

  const rows = bookings.map(b => [
    b.rooms?.room_number || '—',
    roomTypeLabel(b.rooms?.room_type),
    formatDate(b.check_in_date),
    formatDate(b.check_out_date),
    formatINR(b.custom_rate || b.rooms?.base_rate),
    formatINR(b.total_amount),
    b.status,
  ])

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Room', 'Type', 'Check-in', 'Check-out', 'Rate/night', 'Total', 'Status']],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [108, 142, 247] },
  })

  doc.save(`guest-${guest.full_name.replace(/\s+/g, '-')}.pdf`)
}

export function exportBillingPDF(booking, foodOrders) {
  const doc = new jsPDF()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Natural Heaven', 14, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Bondarwadi, Mahabaleshwar', 14, 27)
  doc.setFontSize(9)
  doc.text('INVOICE', 160, 20)
  doc.line(14, 32, 196, 32)

  const g = booking.guests
  const r = booking.rooms
  doc.setFontSize(10)
  doc.text(`Guest: ${g?.full_name}`, 14, 40)
  doc.text(`Mobile: ${g?.mobile}`, 14, 47)
  doc.text(`Room: ${r?.room_number} (${roomTypeLabel(r?.room_type)})`, 14, 54)
  doc.text(`Check-in: ${formatDate(booking.check_in_date)}`, 120, 40)
  if (booking.check_out_date) doc.text(`Check-out: ${formatDate(booking.check_out_date)}`, 120, 47)

  const nights = calcNights(booking.check_in_date, booking.check_out_date)
  const rate = booking.custom_rate || r?.base_rate || 0
  const roomTotal = nights * rate

  doc.line(14, 60, 196, 60)
  doc.setFont('helvetica', 'bold')
  doc.text('Room Charges', 14, 68)
  doc.autoTable({
    startY: 72,
    head: [['Description', 'Nights', 'Rate', 'Amount']],
    body: [[`${r?.room_number} (${roomTypeLabel(r?.room_type)})`, nights, formatINR(rate), formatINR(roomTotal)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [108, 142, 247] },
  })

  if (foodOrders?.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('Food & Beverages', 14, doc.lastAutoTable.finalY + 10)
    const foodRows = foodOrders.map(f => [
      f.item_name,
      f.meal_type,
      f.quantity,
      formatINR(f.rate),
      formatINR(f.total),
    ])
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 14,
      head: [['Item', 'Meal', 'Qty', 'Rate', 'Total']],
      body: foodRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [108, 142, 247] },
    })
  }

  const foodTotal = booking.total_food_amount || 0
  const grandTotal = roomTotal + foodTotal
  const deposit = booking.deposit_amount || 0
  const balance = grandTotal - deposit

  const summary = [
    ['Room charges', formatINR(roomTotal)],
    ['Food & beverages', formatINR(foodTotal)],
    ['Deposit collected', `-${formatINR(deposit)}`],
    ['Grand total', formatINR(grandTotal)],
    ['Balance due', formatINR(balance)],
  ]

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [],
    body: summary,
    columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right', fontStyle: 'bold' } },
    styles: { fontSize: 10 },
    theme: 'plain',
  })

  doc.save(`bill-${g?.full_name?.replace(/\s+/g, '-')}-${r?.room_number}.pdf`)
}

export function exportReportsPDF(stats, dateRange) {
  const doc = new jsPDF()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Natural Heaven — Reports', 14, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Period: ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}`, 14, 28)
  doc.line(14, 32, 196, 32)

  doc.autoTable({
    startY: 38,
    head: [['Metric', 'Value']],
    body: [
      ['Total Bookings', stats.totalBookings],
      ['Total Guests', stats.totalGuests],
      ['Occupancy Rate', `${stats.occupancyRate}%`],
      ['Room Revenue', formatINR(stats.roomRevenue)],
      ['Food Revenue', formatINR(stats.foodRevenue)],
      ['Grand Total Revenue', formatINR(stats.totalRevenue)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [108, 142, 247] },
  })

  doc.save(`report-${dateRange.from}-to-${dateRange.to}.pdf`)
}
