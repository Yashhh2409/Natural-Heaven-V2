import { useState, useEffect } from 'react'
import { FileSpreadsheet, FileText, BarChart2, Calendar } from 'lucide-react'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend,
} from 'chart.js'
import { supabase } from '../lib/supabase'
import { formatDate, formatINR, roomTypeLabel, calcNights, todayISO } from '../lib/formatters'
import { exportReportsPDF } from '../lib/exportPdf'
import { exportReportsExcel } from '../lib/exportExcel'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend)

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { grid: { color: 'rgba(136,146,164,0.1)' }, ticks: { font: { size: 10 } } },
  },
}

function startOfMonth() {
  const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
}

export default function Reports() {
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(todayISO())
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, guests(*), rooms(*)')
        .gte('check_in_date', from)
        .lte('check_in_date', to)
        .order('check_in_date')
      if (error) throw error
      setBookings(data || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [from, to])

  // Stats
  const totalBookings = bookings.length
  const totalGuests = new Set(bookings.map(b => b.guest_id)).size
  const roomRevenue = bookings.reduce((s, b) => {
    const nights = calcNights(b.check_in_date, b.check_out_date)
    return s + nights * (b.custom_rate || b.rooms?.base_rate || 0)
  }, 0)
  const foodRevenue = bookings.reduce((s, b) => s + (b.total_food_amount || 0), 0)
  const totalRevenue = roomRevenue + foodRevenue

  // Unique rooms
  const totalRooms = 10 // fallback; ideally fetch from rooms table
  const occupancyRate = totalRooms > 0 ? Math.round((totalBookings / totalRooms) * 100) : 0

  const stats = { totalBookings, totalGuests, occupancyRate, roomRevenue, foodRevenue, totalRevenue }
  const dateRange = { from, to }

  // Revenue per day chart
  const days = []
  const d = new Date(from)
  const end = new Date(to)
  while (d <= end) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1) }
  const revenueByDay = days.map(day => {
    return bookings
      .filter(b => b.check_in_date === day)
      .reduce((s, b) => s + calcNights(b.check_in_date, b.check_out_date) * (b.custom_rate || b.rooms?.base_rate || 0) + (b.total_food_amount || 0), 0)
  })

  // Bookings by room type
  const typeMap = {}
  bookings.forEach(b => {
    const t = roomTypeLabel(b.rooms?.room_type) || 'Unknown'
    typeMap[t] = (typeMap[t] || 0) + 1
  })

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">Reports</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Business overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportReportsExcel(bookings, dateRange)} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2">
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button onClick={() => exportReportsPDF(stats, dateRange)} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-2">
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Date range */}
      <div className="card p-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar size={16} className="text-brand" />
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <label className="label">From</label>
              <input type="date" className="input-field py-2 text-sm" value={from} onChange={e => setFrom(e.target.value)} max={to} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input-field py-2 text-sm" value={to} onChange={e => setTo(e.target.value)} min={from} max={todayISO()} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : bookings.length === 0 ? (
        <EmptyState icon={BarChart2} message="No data found for selected range" />
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total Bookings', value: totalBookings },
              { label: 'Unique Guests', value: totalGuests },
              { label: 'Occupancy Rate', value: `${occupancyRate}%` },
              { label: 'Room Revenue', value: formatINR(roomRevenue) },
              { label: 'Food Revenue', value: formatINR(foodRevenue) },
              { label: 'Total Revenue', value: formatINR(totalRevenue), highlight: true },
            ].map(s => (
              <div key={s.label} className={`card p-4 ${s.highlight ? 'border-brand' : ''}`} style={s.highlight ? { borderColor: '#6C8EF7' } : {}}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                <p className={`text-xl font-display font-semibold mt-1 ${s.highlight ? 'text-brand' : ''}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue bar chart */}
          <div className="card p-4 mb-4">
            <p className="section-title">Revenue Per Day</p>
            <div className="h-48 overflow-x-auto">
              <div style={{ minWidth: days.length > 14 ? days.length * 28 : 'auto', height: '100%' }}>
                <Bar
                  options={chartOpts}
                  data={{
                    labels: days.map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
                    datasets: [{ data: revenueByDay, backgroundColor: '#6C8EF7', hoverBackgroundColor: '#534AB7', borderRadius: 5 }],
                  }}
                />
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="card p-4">
              <p className="section-title">Bookings by Room Type</p>
              <div className="h-48 flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: Object.keys(typeMap),
                    datasets: [{
                      data: Object.values(typeMap),
                      backgroundColor: ['#6C8EF7', '#22c55e', '#f59e0b', '#ef4444'],
                      borderWidth: 0,
                    }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }}
                />
              </div>
            </div>
            <div className="card p-4">
              <p className="section-title">Revenue Trend</p>
              <div className="h-48">
                <Line
                  options={{ ...chartOpts, plugins: { legend: { display: false } } }}
                  data={{
                    labels: days.map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
                    datasets: [{
                      data: revenueByDay,
                      borderColor: '#6C8EF7',
                      backgroundColor: 'rgba(108,142,247,0.08)',
                      fill: true,
                      tension: 0.4,
                      pointRadius: 3,
                    }],
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
