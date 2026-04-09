import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, TrendingUp, Hotel, ChevronRight, BedDouble } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useRooms } from '../hooks/useRooms'
import { useBookings } from '../hooks/useBookings'
import StatCard from '../components/ui/StatCard'
import RoomPill from '../components/ui/RoomPill'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/Badge'
import { formatDate, roomTypeLabel, calcNights } from '../lib/formatters'
import Modal from '../components/ui/Modal'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: 'rgba(136,146,164,0.1)' }, ticks: { precision: 0, font: { size: 11 } } },
  },
}

function getChartData(data) {
  return {
    labels: data?.labels || [],
    datasets: [{
      data: data?.data || [],
      backgroundColor: '#6C8EF7',
      hoverBackgroundColor: '#534AB7',
      borderRadius: 6,
    }],
  }
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function Dashboard() {
  const { stats, trends, recentBookings, chartData, loading } = useDashboardStats()
  const { rooms, loading: roomsLoading } = useRooms()
  const { bookings: activeBookings } = useBookings()
  const [tab, setTab] = useState('week')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomModalOpen, setRoomModalOpen] = useState(false)

  const handleRoomClick = (room) => {
    const booking = activeBookings.find(b => b.room_id === room.id)
    setSelectedRoom({ room, booking })
    setRoomModalOpen(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size={32} />
    </div>
  )

  return (
    <div className="page-container">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold">Dashboard</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 overflow-x-auto pb-1 mb-5 -mx-4 px-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Guests" value={stats.today} icon={Calendar} />
        <StatCard title="This Week" value={stats.week} icon={Users}
          trend={trends.week}
          trendLabel={trends.week >= 0 ? `+${trends.week} vs last week` : `${trends.week} vs last week`} />
        <StatCard title="This Month" value={stats.month} icon={TrendingUp}
          trend={trends.month}
          trendLabel={trends.month >= 0 ? `+${trends.month} vs last month` : `${trends.month} vs last month`} />
        <StatCard title="This Year" value={stats.year} icon={Hotel} />
      </div>

      {/* Chart */}
      <div className="card p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title mb-0">Guest Arrivals</p>
          <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            {['week','month','year'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${tab === t ? 'bg-brand text-white shadow-sm' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-48 overflow-x-auto">
          <div style={{ minWidth: tab === 'month' ? 600 : 'auto', height: '100%' }}>
            <Bar options={chartOptions} data={getChartData(chartData[tab])} />
          </div>
        </div>
      </div>

      {/* Room Status */}
      <div className="card p-4 mb-5">
        <p className="section-title">Room Status</p>
        {roomsLoading ? <Spinner /> : rooms.length === 0 ? (
          <EmptyState icon={BedDouble} message="No rooms added yet" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {rooms.map(r => <RoomPill key={r.id} room={r} onClick={handleRoomClick} />)}
          </div>
        )}
      </div>

      {/* Recent Guests */}
      <div className="card p-4 mb-2">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title mb-0">Recent Check-ins</p>
          <Link to="/guests" className="text-xs text-brand font-medium flex items-center gap-0.5">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <EmptyState icon={Users} message="No recent check-ins" />
        ) : (
          <div className="space-y-3">
            {recentBookings.map(b => (
              <Link key={b.id} to={`/guests/${b.guest_id}`} className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {getInitials(b.guests?.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.guests?.full_name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    Room {b.rooms?.room_number} · {roomTypeLabel(b.rooms?.room_type)} · {formatDate(b.check_in_date)}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <Modal open={roomModalOpen} onClose={() => setRoomModalOpen(false)} title={`Room ${selectedRoom.room.room_number}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Status</span>
              <StatusBadge status={selectedRoom.room.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Type</span>
              <span className="text-sm font-medium">{roomTypeLabel(selectedRoom.room.room_type)}</span>
            </div>
            {selectedRoom.booking ? (
              <>
                <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>CURRENT GUEST</p>
                  <p className="font-semibold">{selectedRoom.booking.guests?.full_name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedRoom.booking.guests?.mobile}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Check-in</span>
                  <span className="text-sm font-medium">{formatDate(selectedRoom.booking.check_in_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Nights</span>
                  <span className="text-sm font-medium">{calcNights(selectedRoom.booking.check_in_date)} nights</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Rate/night</span>
                  <span className="text-sm font-medium">₹{selectedRoom.booking.custom_rate || selectedRoom.room.base_rate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Deposit</span>
                  <span className="text-sm font-medium">₹{selectedRoom.booking.deposit_amount}</span>
                </div>
                <Link
                  to={`/guests/${selectedRoom.booking.guest_id}`}
                  onClick={() => setRoomModalOpen(false)}
                  className="btn-primary w-full text-center block mt-2"
                >
                  View Full Details
                </Link>
              </>
            ) : (
              <p className="text-sm text-center py-2" style={{ color: 'var(--text-muted)' }}>No active booking</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
