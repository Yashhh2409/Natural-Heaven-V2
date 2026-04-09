import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Trash2, ChevronLeft, UtensilsCrossed, Loader2 } from 'lucide-react'
import { useBooking } from '../hooks/useBookings'
import { useFoodOrders } from '../hooks/useFoodOrders'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { formatINR, formatDateTime, mealTypeLabel } from '../lib/formatters'
import toast from 'react-hot-toast'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'other']

const mealColors = {
  breakfast: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  lunch: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  dinner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  snacks: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const defaultForm = { meal_type: 'lunch', item_name: '', quantity: 1, rate: '', notes: '' }

export default function FoodManagement() {
  const { id: bookingId } = useParams()
  const { booking, loading: bookingLoading } = useBooking(bookingId)
  const { orders, loading: ordersLoading, total, addOrder, deleteOrder } = useFoodOrders(bookingId)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!form.item_name.trim()) { toast.error('Please enter item name'); return }
    if (!form.rate || form.rate <= 0) { toast.error('Please enter a valid rate'); return }
    setSaving(true)
    try {
      await addOrder({ ...form, quantity: parseInt(form.quantity) || 1, rate: parseFloat(form.rate) })
      setForm(defaultForm)
      setModalOpen(false)
    } catch (e) {
      toast.error(e.message || 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try { await deleteOrder(id) } catch (e) { toast.error(e.message || 'Failed to delete') }
  }

  if (bookingLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={32} /></div>

  return (
    <div className="page-container max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link to="/current" className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 -ml-2">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-semibold">Food Orders</h1>
          {booking && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {booking.guests?.full_name} · Room {booking.rooms?.room_number}
          </p>}
        </div>
      </div>

      {/* Food total card */}
      <div className="card p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Food Bill</p>
          <p className="text-3xl font-display font-semibold text-brand">{formatINR(total)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{orders.length} items</p>
          <Link to={`/billing/${bookingId}`} className="text-xs text-brand font-medium mt-1 block">View Full Bill →</Link>
        </div>
      </div>

      {/* Orders list */}
      {ordersLoading ? <div className="flex justify-center py-8"><Spinner /></div> : orders.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} message="No food orders yet" />
      ) : (
        <div className="space-y-2 mb-4">
          {orders.map(o => (
            <div key={o.id} className="card p-3.5 flex items-start gap-3 fade-in">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`badge text-xs ${mealColors[o.meal_type] || mealColors.other}`}>
                    {mealTypeLabel(o.meal_type)}
                  </span>
                  <span className="font-medium text-sm">{o.item_name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Qty: {o.quantity}</span>
                  <span>×</span>
                  <span>{formatINR(o.rate)}</span>
                  <span>=</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{formatINR(o.total || o.quantity * o.rate)}</span>
                </div>
                {o.notes && <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>{o.notes}</p>}
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatDateTime(o.ordered_at)}</p>
              </div>
              <button onClick={() => handleDelete(o.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Meal type summary */}
      {orders.length > 0 && (
        <div className="card p-4 mb-4">
          <p className="text-sm font-semibold mb-3">By Meal Type</p>
          {MEAL_TYPES.map(type => {
            const items = orders.filter(o => o.meal_type === type)
            if (!items.length) return null
            const subtotal = items.reduce((s, o) => s + (o.total || o.quantity * o.rate), 0)
            return (
              <div key={type} className="flex items-center justify-between py-1.5">
                <span className={`badge text-xs ${mealColors[type]}`}>{mealTypeLabel(type)}</span>
                <span className="text-sm font-medium">{formatINR(subtotal)}</span>
              </div>
            )
          })}
          <div className="border-t mt-2 pt-2 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <span className="font-semibold text-sm">Total</span>
            <span className="font-semibold text-brand">{formatINR(total)}</span>
          </div>
        </div>
      )}

      {/* Add button */}
      <button onClick={() => setModalOpen(true)} className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
        <Plus size={16} /> Add Food Item
      </button>

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Food Item">
        <div className="space-y-3">
          <div>
            <label className="label">Meal Type</label>
            <select className="input-field" value={form.meal_type} onChange={e => setForm(f => ({ ...f, meal_type: e.target.value }))}>
              {MEAL_TYPES.map(t => <option key={t} value={t}>{mealTypeLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Item Name *</label>
            <input className="input-field" placeholder="Veg Thali, Masala Chai…" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input-field" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} min="1" />
            </div>
            <div>
              <label className="label">Rate (₹) *</label>
              <input type="number" className="input-field" placeholder="0" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} min="0" />
            </div>
          </div>
          {form.quantity && form.rate && (
            <div className="card p-3 flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Item Total</span>
              <span className="font-semibold text-brand">{formatINR(form.quantity * form.rate)}</span>
            </div>
          )}
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input-field" placeholder="Extra spicy, less sugar…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Add Item
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
