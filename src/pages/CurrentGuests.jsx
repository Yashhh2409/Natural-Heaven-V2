import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed, LogOut, Users, Loader2, ShieldCheck, ShieldX } from 'lucide-react'
import { useBookings } from '../hooks/useBookings'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { formatDate, formatINR, calcNights, roomTypeLabel } from '../lib/formatters'
import { StatusBadge } from '../components/ui/Badge'
import toast from 'react-hot-toast'

export default function CurrentGuests() {
  const { bookings, loading, checkOut } = useBookings()
  const [checkoutTarget, setCheckoutTarget] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)

  const handleCheckout = async () => {
    setCheckingOut(true)
    try {
      await checkOut(checkoutTarget)
      setCheckoutTarget(null)
    } catch (e) {
      toast.error(e.message || 'Checkout failed')
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={32} /></div>

  return (
    <div className="page-container">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold">Current Guests</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{bookings.length} active bookings</p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState icon={Users} message="No guests currently checked in" action={
          <Link to="/checkin" className="btn-primary">New Check-in</Link>
        } />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    {['Room', 'Guest', 'Mobile', 'Check-in', 'Nights', 'Rate/night', 'Food', 'Total', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const nights = calcNights(b.check_in_date)
                    const rate = b.custom_rate || b.rooms?.base_rate || 0
                    const roomTotal = nights * rate
                    const foodTotal = b.total_food_amount || 0
                    const grandTotal = roomTotal + foodTotal
                    return (
                      <tr key={b.id} style={{ borderBottom: '0.5px solid var(--border)' }} className="hover:bg-black/1 dark:hover:bg-white/1">
                        <td className="px-4 py-3 font-semibold">{b.rooms?.room_number}</td>
                        <td className="px-4 py-3">
                          <Link to={`/guests/${b.guest_id}`} className="hover:text-brand transition-colors font-medium">{b.guests?.full_name}</Link>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{b.guests?.mobile}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{formatDate(b.check_in_date)}</td>
                        <td className="px-4 py-3">{nights}</td>
                        <td className="px-4 py-3">{formatINR(rate)}</td>
                        <td className="px-4 py-3">{formatINR(foodTotal)}</td>
                        <td className="px-4 py-3 font-semibold">{formatINR(grandTotal)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Link to={`/booking/${b.id}/food`} title="Manage Food"
                              className="p-2 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                              <UtensilsCrossed size={14} />
                            </Link>
                            <button onClick={() => setCheckoutTarget(b)} title="Check Out"
                              className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                              <LogOut size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {bookings.map(b => {
              const nights = calcNights(b.check_in_date)
              const rate = b.custom_rate || b.rooms?.base_rate || 0
              const grandTotal = nights * rate + (b.total_food_amount || 0)
              return (
                <div key={b.id} className="card p-4 fade-in">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">Room {b.rooms?.room_number}</span>
                        <span className="badge badge-active text-xs">{nights} nights</span>
                      </div>
                      <Link to={`/guests/${b.guest_id}`} className="font-medium text-sm text-brand">{b.guests?.full_name}</Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.guests?.mobile}</p>
                        {b.guests?.is_mobile_verified
                          ? <ShieldCheck size={11} className="text-green-500 flex-shrink-0" />
                          : <ShieldX size={11} className="text-amber-500 flex-shrink-0" />
                        }
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatINR(grandTotal)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>total</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    <span>Check-in: {formatDate(b.check_in_date)}</span>
                    <span>{formatINR(rate)}/night</span>
                    <span>Food: {formatINR(b.total_food_amount)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/booking/${b.id}/food`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-600 active:scale-95 transition-transform">
                      <UtensilsCrossed size={15} /> Food
                    </Link>
                    <Link to={`/billing/${b.id}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-brand/10 text-brand active:scale-95 transition-transform">
                      Bill
                    </Link>
                    <button onClick={() => setCheckoutTarget(b)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-500 active:scale-95 transition-transform">
                      <LogOut size={15} /> Out
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Checkout confirm modal */}
      <Modal open={!!checkoutTarget} onClose={() => setCheckoutTarget(null)} title="Check Out Guest">
        {checkoutTarget && (
          <div>
            <p className="text-sm mb-1">Check out <strong>{checkoutTarget.guests?.full_name}</strong> from Room <strong>{checkoutTarget.rooms?.room_number}</strong>?</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Room will be marked for cleaning after checkout.</p>
            <div className="flex gap-3">
              <button onClick={() => setCheckoutTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCheckout} disabled={checkingOut} className="flex-1 bg-red-500 text-white rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-center gap-2">
                {checkingOut && <Loader2 size={14} className="animate-spin" />}
                Check Out
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
