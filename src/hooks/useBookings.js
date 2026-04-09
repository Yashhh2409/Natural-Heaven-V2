import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { calcNights } from '../lib/formatters'

export function useBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select('*, guests(*), rooms(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      if (error) throw error
      setBookings(data || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createBooking = async ({ room, guest, rate, deposit, checkInDate, notes }) => {
    const { data, error } = await supabase.from('bookings').insert([{
      room_id: room.id,
      guest_id: guest.id,
      check_in_date: checkInDate,
      custom_rate: rate,
      deposit_amount: deposit,
      notes,
      status: 'active',
      payment_status: 'pending',
    }]).select().single()
    if (error) throw error

    // Mark room occupied
    await supabase.from('rooms').update({ status: 'occupied' }).eq('id', room.id)
    return data
  }

  const checkOut = async (booking) => {
    // Fetch latest food total from DB to ensure accuracy
    const { data: foodData } = await supabase
      .from('food_orders')
      .select('quantity, rate')
      .eq('booking_id', booking.id)
    const latestFoodTotal = (foodData || []).reduce((s, o) => s + o.quantity * o.rate, 0)

    const today = new Date().toISOString().split('T')[0]
    const nights = calcNights(booking.check_in_date, today)
    const rate = booking.custom_rate || booking.rooms?.base_rate || 0
    const roomTotal = nights * rate
    const grandTotal = roomTotal + latestFoodTotal

    const { error } = await supabase.from('bookings').update({
      status: 'checked_out',
      check_out_date: today,
      total_room_amount: roomTotal,
      total_food_amount: latestFoodTotal,
      total_amount: grandTotal,
    }).eq('id', booking.id)
    if (error) throw error

    await supabase.from('rooms').update({ status: 'cleaning' }).eq('id', booking.room_id)
    setBookings(prev => prev.filter(b => b.id !== booking.id))
    toast.success(`${booking.guests?.full_name} checked out. Room ${booking.rooms?.room_number} marked for cleaning.`)
  }

  return { bookings, loading, refetch: fetch, createBooking, checkOut }
}

export function useBooking(id) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select('*, guests(*), rooms(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      setBooking(data)
    } catch (e) {
      toast.error(e.message || 'Failed to load booking')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  const updatePaymentStatus = async (status) => {
    const { data, error } = await supabase.from('bookings')
      .update({ payment_status: status }).eq('id', id).select('*, guests(*), rooms(*)').single()
    if (error) throw error
    setBooking(data)
    toast.success(`Payment marked as ${status}`)
  }

  return { booking, loading, refetch: fetch, updatePaymentStatus }
}
