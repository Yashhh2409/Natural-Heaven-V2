import { useState } from 'react'
import { Plus, Pencil, Trash2, BedDouble, ChevronDown, Loader2 } from 'lucide-react'
import { useRooms } from '../hooks/useRooms'
import { StatusBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { formatINR, roomTypeLabel } from '../lib/formatters'
import toast from 'react-hot-toast'

const ROOM_TYPES = [
  { value: 'non_ac_standard', label: 'Non-AC Standard' },
  { value: 'non_ac_deluxe', label: 'Non-AC Deluxe' },
  { value: 'ac_standard', label: 'AC Standard' },
  { value: 'ac_deluxe', label: 'AC Deluxe' },
]
const STATUSES = ['vacant', 'occupied', 'cleaning', 'maintenance']
const defaultForm = { room_number: '', room_type: 'non_ac_standard', floor: 1, base_rate: 1000, default_deposit: 500, description: '' }

export default function Rooms() {
  const { rooms, loading, addRoom, updateRoom, deleteRoom, updateStatus } = useRooms()
  const [modalOpen, setModalOpen] = useState(false)
  const [editRoom, setEditRoom] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [statusMenuRoom, setStatusMenuRoom] = useState(null)

  const openAdd = () => { setEditRoom(null); setForm(defaultForm); setModalOpen(true) }
  const openEdit = (room) => {
    setEditRoom(room)
    setForm({ room_number: room.room_number, room_type: room.room_type, floor: room.floor, base_rate: room.base_rate, default_deposit: room.default_deposit, description: room.description || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.room_number.trim()) { toast.error('Room number is required'); return }
    setSaving(true)
    try {
      if (editRoom) await updateRoom(editRoom.id, form)
      else await addRoom(form)
      setModalOpen(false)
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (room) => {
    try { await deleteRoom(room.id); setDeleteConfirm(null) } catch {}
  }

  const handleStatusChange = async (room, status) => {
    setStatusMenuRoom(null)
    if (room.status === status) return
    if (status === 'occupied') { toast.error('Set occupied via Check-in only'); return }
    await updateStatus(room.id, status)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size={32} /></div>

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-semibold">Rooms</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{rooms.length} rooms total</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 hidden sm:flex">
          <Plus size={16} /> Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState icon={BedDouble} message="No rooms added yet. Add your first room!" action={
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Room</button>
        } />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map(room => (
            <div key={room.id} className="card p-4 fade-in">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-2xl font-display font-semibold">{room.room_number}</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Floor {room.floor}</p>
                </div>
                <StatusBadge status={room.status} />
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">
                {roomTypeLabel(room.room_type)}
              </span>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Rate/night</p>
                  <p className="font-semibold">{formatINR(room.base_rate)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Deposit</p>
                  <p className="font-semibold">{formatINR(room.default_deposit)}</p>
                </div>
              </div>
              {room.description && <p className="text-xs mt-2 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{room.description}</p>}

              <div className="mt-3 flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                {/* Status dropdown */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setStatusMenuRoom(statusMenuRoom === room.id ? null : room.id)}
                    className="w-full btn-secondary text-xs flex items-center justify-center gap-1 px-2 py-2"
                  >
                    Status <ChevronDown size={12} />
                  </button>
                  {statusMenuRoom === room.id && (
                    <div className="absolute top-full left-0 mt-1 card shadow-lg z-20 w-36 py-1">
                      {STATUSES.filter(s => s !== 'occupied').map(s => (
                        <button key={s} onClick={() => handleStatusChange(room, s)}
                          className={`w-full text-left px-3 py-2 text-xs capitalize hover:bg-black/5 dark:hover:bg-white/5 ${room.status === s ? 'text-brand font-medium' : ''}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => openEdit(room)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
                  <Pencil size={15} className="text-brand" />
                </button>
                <button onClick={() => setDeleteConfirm(room)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
                  <Trash2 size={15} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB mobile */}
      <button
        onClick={openAdd}
        className="fixed bottom-20 right-4 lg:hidden w-14 h-14 rounded-2xl bg-brand text-white shadow-lg shadow-brand/30 flex items-center justify-center active:scale-95 transition-transform z-20"
      >
        <Plus size={24} />
      </button>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRoom ? 'Edit Room' : 'Add Room'}>
        <div className="space-y-3">
          <div>
            <label className="label">Room Number *</label>
            <input className="input-field" placeholder="101" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} />
          </div>
          <div>
            <label className="label">Room Type</label>
            <select className="input-field" value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}>
              {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Floor</label>
              <input type="number" className="input-field" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) || 1 }))} min="1" />
            </div>
            <div>
              <label className="label">Base Rate (₹)</label>
              <input type="number" className="input-field" value={form.base_rate} onChange={e => setForm(f => ({ ...f, base_rate: parseFloat(e.target.value) || 0 }))} min="0" />
            </div>
          </div>
          <div>
            <label className="label">Default Deposit (₹)</label>
            <input type="number" className="input-field" value={form.default_deposit} onChange={e => setForm(f => ({ ...f, default_deposit: parseFloat(e.target.value) || 0 }))} min="0" />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mountain view, ground floor…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editRoom ? 'Update' : 'Add Room'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Room">
        <p className="text-sm mb-4">Are you sure you want to delete Room <strong>{deleteConfirm?.room_number}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 text-white rounded-xl px-4 py-3 text-sm font-medium">
            Delete
          </button>
        </div>
      </Modal>

      {/* Close status menus on outside click */}
      {statusMenuRoom && <div className="fixed inset-0 z-10" onClick={() => setStatusMenuRoom(null)} />}
    </div>
  )
}
