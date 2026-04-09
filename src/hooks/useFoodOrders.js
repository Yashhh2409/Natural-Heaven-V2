import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useFoodOrders(bookingId) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!bookingId) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('food_orders')
        .select('*')
        .eq('booking_id', bookingId)
        .order('ordered_at', { ascending: false })
      if (error) throw error
      setOrders(data || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load food orders')
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => { fetch() }, [fetch])

  const addOrder = async (order) => {
    const { data, error } = await supabase
      .from('food_orders')
      .insert([{ ...order, booking_id: bookingId }])
      .select()
      .single()
    if (error) throw error
    setOrders(prev => [data, ...prev])

    // Update booking food total
    const newTotal = [...orders, data].reduce((sum, o) => sum + (o.total || o.quantity * o.rate), 0)
    await supabase.from('bookings').update({ total_food_amount: newTotal }).eq('id', bookingId)
    toast.success('Food item added')
    return data
  }

  const deleteOrder = async (orderId) => {
    const { error } = await supabase.from('food_orders').delete().eq('id', orderId)
    if (error) throw error
    const remaining = orders.filter(o => o.id !== orderId)
    setOrders(remaining)
    const newTotal = remaining.reduce((sum, o) => sum + (o.total || o.quantity * o.rate), 0)
    await supabase.from('bookings').update({ total_food_amount: newTotal }).eq('id', bookingId)
    toast.success('Item removed')
  }

  const total = orders.reduce((sum, o) => sum + (o.total || o.quantity * o.rate), 0)

  return { orders, loading, total, refetch: fetch, addOrder, deleteOrder }
}
