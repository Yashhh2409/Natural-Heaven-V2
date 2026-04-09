import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getOrCreateWorkspace,
  getWorkspaceMembers,
  getWorkspaceInvites,
  inviteMember,
  revokeMember,
  cancelInvite,
  updateWorkspace,
} from '../lib/workspaceService'
import toast from 'react-hot-toast'

export function useWorkspace() {
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState(null)
  const [myMember, setMyMember] = useState(null)
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { workspace: ws, member } = await getOrCreateWorkspace(user.id, user.email)
      setWorkspace(ws)
      setMyMember(member)
      if (ws) {
        const [mems, invs] = await Promise.all([
          getWorkspaceMembers(ws.id),
          getWorkspaceInvites(ws.id),
        ])
        setMembers(mems)
        setInvites(invs)
      }
    } catch (e) {
      console.error('Workspace load error:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const invite = async (email, role = 'owner') => {
    if (!workspace) throw new Error('Workspace not loaded')
    const { invite: inv, emailSent } = await inviteMember(
      workspace.id,
      email,
      role,
      user.id,
      user.email,
      workspace.name
    )
    await load()
    return { invite: inv, emailSent }
  }

  const revoke = async (memberId) => {
    await revokeMember(memberId)
    setMembers(m => m.filter(x => x.id !== memberId))
    toast.success('Access revoked')
  }

  const cancelPendingInvite = async (inviteId) => {
    await cancelInvite(inviteId)
    setInvites(i => i.filter(x => x.id !== inviteId))
    toast.success('Invite cancelled')
  }

  const update = async (updates) => {
    if (!workspace) return
    const ws = await updateWorkspace(workspace.id, updates)
    setWorkspace(ws)
    toast.success('Workspace updated')
  }

  const isOwner = myMember?.role === 'owner'

  return {
    workspace, myMember, members, invites, loading,
    isOwner, invite, revoke, cancelPendingInvite, update, refetch: load,
  }
}
