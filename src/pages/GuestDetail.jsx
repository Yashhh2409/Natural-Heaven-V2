import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Printer, ChevronLeft, ZoomIn, BedDouble, ShieldCheck, ShieldX } from 'lucide-react'
import { useGuest } from '../hooks/useGuests'
import Spinner from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/Badge'
import Lightbox from '../components/ui/Lightbox'
import { formatDate, formatINR, maskID, roomTypeLabel, calcNights } from '../lib/formatters'
import { exportGuestPDF } from '../lib/exportPdf'

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function GuestDetail() {
  const { id } = useParams()
  const { guest, bookings, loading } = useGuest(id)
  const [lightbox, setLightbox] = useState(null)

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={32} /></div>
  if (!guest) return (
    <div className="page-container text-center py-16">
      <p style={{ color: 'var(--text-muted)' }}>Guest not found</p>
      <Link to="/guests" className="btn-primary mt-4 inline-block">← Back to Guests</Link>
    </div>
  )

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/guests" className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 -ml-2">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-display text-xl font-semibold">Guest Profile</h1>
        <div className="ml-auto flex gap-2">
          <button onClick={() => exportGuestPDF(guest, bookings)} className="btn-secondary flex items-center gap-2 text-xs px-3 py-2">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-xl font-semibold">
            {getInitials(guest.full_name)}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{guest.full_name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p style={{ color: 'var(--text-muted)' }} className="text-sm">{guest.mobile}</p>
              {guest.is_mobile_verified
                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <ShieldCheck size={11} /> Verified
                  </span>
                : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <ShieldX size={11} /> Not Verified
                  </span>
              }
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            ['Address', guest.address],
            guest.city && ['City', guest.city],
            guest.state && ['State', guest.state],
            ['ID Type', guest.id_type?.replace('_', ' ').toUpperCase()],
            ['ID Number', maskID(guest.id_type, guest.id_number)],
            ['Member since', formatDate(guest.created_at)],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4">
              <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span className="text-sm font-medium text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Photos */}
      {(guest.id_document_url || guest.live_photo_url) && (
        <div className="card p-4 mb-4">
          <p className="text-sm font-semibold mb-3">Documents & Photos</p>
          <div className="flex gap-3">
            {guest.id_document_url && (
              <button onClick={() => setLightbox(guest.id_document_url)} className="relative group">
                <img src={guest.id_document_url} alt="ID" className="w-24 h-16 object-cover rounded-xl border" style={{ borderColor: 'var(--border)' }} />
                <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn size={16} className="text-white" />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>ID Document</p>
              </button>
            )}
            {guest.live_photo_url && (
              <button onClick={() => setLightbox(guest.live_photo_url)} className="relative group">
                <img src={guest.live_photo_url} alt="Photo" className="w-16 h-16 object-cover rounded-xl border" style={{ borderColor: 'var(--border)' }} />
                <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn size={16} className="text-white" />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Live Photo</p>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Booking History */}
      <div className="card p-4 mb-4">
        <p className="text-sm font-semibold mb-3">Booking History ({bookings.length})</p>
        {bookings.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No bookings yet</p>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => {
              const nights = calcNights(b.check_in_date, b.check_out_date)
              const rate = b.custom_rate || b.rooms?.base_rate || 0
              const roomTotal = nights * rate
              return (
                <div key={b.id} className="border rounded-xl p-3 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Room {b.rooms?.room_number}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{roomTypeLabel(b.rooms?.room_type)}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Check-in</span><span>{formatDate(b.check_in_date)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Check-out</span><span>{b.check_out_date ? formatDate(b.check_out_date) : 'Active'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Nights</span><span>{nights}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Rate</span><span>{formatINR(rate)}/night</span>
                    <span style={{ color: 'var(--text-muted)' }}>Room total</span><span>{formatINR(roomTotal)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Food</span><span>{formatINR(b.total_food_amount)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Deposit</span><span>{formatINR(b.deposit_amount)}</span>
                    <span className="font-semibold">Grand Total</span><span className="font-semibold">{formatINR(b.total_amount || (roomTotal + (b.total_food_amount || 0)))}</span>
                  </div>
                  <Link to={`/billing/${b.id}`} className="text-xs text-brand font-medium mt-1 block">
                    View Bill →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  )
}
