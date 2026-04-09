import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function getWeekStart(offset = 0) {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function getMonthStart(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function useDashboardStats() {
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, year: 0 })
  const [trends, setTrends] = useState({ week: 0, month: 0 })
  const [recentBookings, setRecentBookings] = useState([])
  const [chartData, setChartData] = useState({ week: {}, month: {}, year: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const now = new Date()
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]

        const { data: all } = await supabase
          .from('bookings')
          .select('*, guests(*), rooms(*)')
          .gte('check_in_date', yearStart)
          .order('created_at', { ascending: false })

        const bookings = all || []

        const todayStr = now.toISOString().split('T')[0]
        const weekStartStr = getWeekStart(0).toISOString().split('T')[0]
        const prevWeekStartStr = getWeekStart(-1).toISOString().split('T')[0]
        const monthStartStr = getMonthStart(0).toISOString().split('T')[0]
        const prevMonthStartStr = getMonthStart(-1).toISOString().split('T')[0]

        const thisWeekCount = bookings.filter(b => b.check_in_date >= weekStartStr).length
        const prevWeekCount = bookings.filter(b => b.check_in_date >= prevWeekStartStr && b.check_in_date < weekStartStr).length
        const thisMonthCount = bookings.filter(b => b.check_in_date >= monthStartStr).length
        const prevMonthCount = bookings.filter(b => b.check_in_date >= prevMonthStartStr && b.check_in_date < monthStartStr).length

        setStats({
          today: bookings.filter(b => b.check_in_date === todayStr).length,
          week: thisWeekCount,
          month: thisMonthCount,
          year: bookings.length,
        })

        setTrends({
          week: thisWeekCount - prevWeekCount,
          month: thisMonthCount - prevMonthCount,
        })

        setRecentBookings(bookings.slice(0, 6))

        // Week chart: last 7 days
        const weekDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i))
          return d.toISOString().split('T')[0]
        })

        // Month chart
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth(), i + 1)
          return d.toISOString().split('T')[0]
        })

        // Year chart
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

        setChartData({
          week: {
            labels: weekDays.map(d => new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short' })),
            data: weekDays.map(d => bookings.filter(b => b.check_in_date === d).length),
          },
          month: {
            labels: monthDays.map(d => new Date(d + 'T12:00:00').getDate().toString()),
            data: monthDays.map(d => bookings.filter(b => b.check_in_date === d).length),
          },
          year: {
            labels: months,
            data: months.map((_, i) => bookings.filter(b => {
              const d = new Date(b.check_in_date + 'T12:00:00')
              return d.getFullYear() === now.getFullYear() && d.getMonth() === i
            }).length),
          },
        })
      } catch (e) {
        console.error('Dashboard stats error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { stats, trends, recentBookings, chartData, loading }
}
