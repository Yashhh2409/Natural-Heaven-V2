import { useParams, Link } from 'react-router-dom'
import { Printer, Download, CheckCircle, ChevronLeft, Clock, Loader2 } from 'lucide-react'
import { useBooking } from '../hooks/useBookings'
import { useFoodOrders } from '../hooks/useFoodOrders'
import Spinner from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/Badge'
import { formatDate, formatINR, roomTypeLabel, calcNights, mealTypeLabel } from '../lib/formatters'
import { exportBillingPDF } from '../lib/exportPdf'
import toast from 'react-hot-toast'
import { useState } from 'react'

const mealColors = {
  breakfast: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  lunch: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  dinner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  snacks: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function Billing() {
  const { bookingId } = useParams()
  const { booking, loading, updatePaymentStatus } = useBooking(bookingId)
  const { orders, loading: foodLoading } = useFoodOrders(bookingId)
  const [updating, setUpdating] = useState(false)

  const handlePayment = async (status) => {
    setUpdating(true)
    try { await updatePaymentStatus(status) }
    catch (e) { toast.error(e.message || 'Failed to update') }
    finally { setUpdating(false) }
  }

  if (loading || foodLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={32} /></div>
  if (!booking) return <div className="page-container text-center py-16"><p style={{ color: 'var(--text-muted)' }}>Booking not found</p></div>

  const nights = calcNights(booking.check_in_date, booking.check_out_date)
  const rate = booking.custom_rate || booking.rooms?.base_rate || 0
  const roomTotal = nights * rate
  const foodTotal = orders.reduce((s, o) => s + (o.total || o.quantity * o.rate), 0)
  const grandTotal = roomTotal + foodTotal
  const deposit = booking.deposit_amount || 0
  const balance = grandTotal - deposit

  return (
    <div className="page-container max-w-xl">
      {/* Nav (hidden on print) */}
      <div className="flex items-center gap-3 mb-5 no-print">
        <Link to="/current" className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 -ml-2">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-display text-xl font-semibold flex-1">Bill</h1>
        <button onClick={() => exportBillingPDF(booking, orders)} className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs">
          <Download size={14} /> PDF
        </button>
        <button onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs">
          <Printer size={14} /> Print
        </button>
      </div>

      {/* Bill Card */}
      <div className="card p-5" id="bill-content">
        {/* Hotel header */}
        <div className="text-center mb-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-display text-2xl font-semibold">Natural Heaven</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Bondarwadi, Mahabaleshwar</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>INVOICE</p>
        </div>

        {/* Guest info */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Guest</p>
            <p className="font-semibold">{booking.guests?.full_name}</p>
            <p style={{ color: 'var(--text-muted)' }}>{booking.guests?.mobile}</p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Room</p>
            <p className="font-semibold">Room {booking.rooms?.room_number}</p>
            <p style={{ color: 'var(--text-muted)' }}>{roomTypeLabel(booking.rooms?.room_type)}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Check-in</p>
            <p className="font-medium">{formatDate(booking.check_in_date)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{booking.check_out_date ? 'Check-out' : 'Status'}</p>
            <p className="font-medium">{booking.check_out_date ? formatDate(booking.check_out_date) : <span className="text-green-500">Active</span>}</p>
          </div>
        </div>

        {/* Room charges */}
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Room Charges</p>
          <div className="flex items-start justify-between text-sm">
            <div>
              <p className="font-medium">Room {booking.rooms?.room_number} ({roomTypeLabel(booking.rooms?.room_type)})</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{nights} night{nights !== 1 ? 's' : ''} × {formatINR(rate)}/night</p>
            </div>
            <p className="font-semibold">{formatINR(roomTotal)}</p>
          </div>
        </div>

        {/* Food */}
        {orders.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Food & Beverages</p>
            <div className="space-y-1.5">
              {orders.map(o => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${mealColors[o.meal_type] || mealColors.other}`}>{mealTypeLabel(o.meal_type)}</span>
                    <span>{o.item_name} × {o.quantity}</span>
                  </div>
                  <span>{formatINR(o.total || o.quantity * o.rate)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Food subtotal</span>
                <span className="font-medium">{formatINR(foodTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Room charges</span>
            <span>{formatINR(roomTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Food & beverages</span>
            <span>{formatINR(foodTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Deposit collected</span>
            <span>–{formatINR(deposit)}</span>
          </div>
          <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }} />
          <div className="flex justify-between font-bold text-lg">
            <span>Grand Total</span>
            <span>{formatINR(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Balance Due</span>
            <span className="text-red-500">{formatINR(balance)}</span>
          </div>
        </div>

        {/* Payment status */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Payment Status</span>
          <StatusBadge status={booking.payment_status} />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2 no-print">
        <div className="flex gap-2">
          <button
            onClick={() => handlePayment('paid')}
            disabled={updating || booking.payment_status === 'paid'}
            className="flex-1 bg-green-500 text-white rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform"
          >
            {updating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Mark as Paid
          </button>
          <button
            onClick={() => handlePayment('partial')}
            disabled={updating || booking.payment_status === 'partial'}
            className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Clock size={14} /> Partial
          </button>
        </div>
      </div>
    </div>
  )
}
