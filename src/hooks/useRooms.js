import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('rooms').select('*').order('room_number')
      if (error) throw error
      setRooms(data || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addRoom = async (room) => {
    try {
      const { data, error } = await supabase.from('rooms').insert([room]).select().single()
      if (error) {
        if (error.code === '23505') throw new Error('Room number already exists')
        throw error
      }
      setRooms(prev => [...prev, data].sort((a, b) => a.room_number.localeCompare(b.room_number)))
      toast.success('Room added successfully')
      return data
    } catch (e) {
      toast.error(e.message || 'Failed to add room')
      throw e
    }
  }

  const updateRoom = async (id, updates) => {
    try {
      const { data, error } = await supabase.from('rooms').update(updates).eq('id', id).select().single()
      if (error) {
        if (error.code === '23505') throw new Error('Room number already exists')
        throw error
      }
      setRooms(prev => prev.map(r => r.id === id ? data : r))
      toast.success('Room updated')
      return data
    } catch (e) {
      toast.error(e.message || 'Failed to update room')
      throw e
    }
  }

  const deleteRoom = async (id) => {
    try {
      const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true })
        .eq('room_id', id).eq('status', 'active')
      if (count > 0) throw new Error('Cannot delete room with active booking')
      const { error } = await supabase.from('rooms').delete().eq('id', id)
      if (error) throw error
      setRooms(prev => prev.filter(r => r.id !== id))
      toast.success('Room deleted')
    } catch (e) {
      toast.error(e.message || 'Failed to delete room')
      throw e
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const { data, error } = await supabase.from('rooms').update({ status }).eq('id', id).select().single()
      if (error) throw error
      setRooms(prev => prev.map(r => r.id === id ? data : r))
    } catch (e) {
      toast.error(e.message || 'Failed to update status')
    }
  }

  return { rooms, loading, refetch: fetch, addRoom, updateRoom, deleteRoom, updateStatus }
}
