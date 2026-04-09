import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useGuests(search = '') {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from('guests').select('*').order('created_at', { ascending: false })
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,mobile.ilike.%${search}%,id_number.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      setGuests(data || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load guests')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetch() }, [fetch])

  const addGuest = async (guest) => {
    const { data, error } = await supabase.from('guests').insert([guest]).select().single()
    if (error) throw error
    return data
  }

  return { guests, loading, refetch: fetch, addGuest }
}

export function useGuest(id) {
  const [guest, setGuest] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        setLoading(true)
        const [{ data: g, error: ge }, { data: b, error: be }] = await Promise.all([
          supabase.from('guests').select('*').eq('id', id).single(),
          supabase.from('bookings').select('*, rooms(*)').eq('guest_id', id).order('created_at', { ascending: false }),
        ])
        if (ge) throw ge
        if (be) throw be
        setGuest(g)
        setBookings(b || [])
      } catch (e) {
        toast.error(e.message || 'Failed to load guest')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return { guest, bookings, loading }
}
