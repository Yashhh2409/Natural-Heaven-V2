import { useState } from 'react'
import { KeyRound, Sun, Moon, Save, Loader2, UserPlus, Users, Trash2, Mail, Crown, Shield, Clock, RefreshCw, Copy, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useWorkspace } from '../hooks/useWorkspace'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { formatDate } from '../lib/formatters'

const ROLE_LABELS = { owner: 'Owner', manager: 'Manager' }

function RoleBadge({ role }) {
  return role === 'owner'
    ? <span className="badge bg-brand/10 text-brand flex items-center gap-1"><Crown size={10} /> Owner</span>
    : <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1"><Shield size={10} /> Manager</span>
}

function StatusDot({ status }) {
  const colors = { active: 'bg-green-500', invited: 'bg-amber-400', revoked: 'bg-gray-400' }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-gray-400'}`} />
}

export default function Settings() {
  const { user } = useAuth()
  const { dark, toggle } = useTheme()
  const { workspace, myMember, members, invites, loading: wsLoading, isOwner, invite, revoke, cancelPendingInvite, update, refetch } = useWorkspace()

  const [hotelName, setHotelName] = useState(() => localStorage.getItem('nh_hotel_name') || 'Natural Heaven')
  const [hotelAddress, setHotelAddress] = useState(() => localStorage.getItem('nh_hotel_address') || 'Bondarwadi, Mahabaleshwar')

  const [defaultRates, setDefaultRates] = useState({
    non_ac_standard: 1000, non_ac_deluxe: 1500, ac_standard: 2000, ac_deluxe: 2500,
  })

  const [pwd, setPwd] = useState({ newPwd: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('owner')
  const [inviting, setInviting] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [copiedInvite, setCopiedInvite] = useState(null)

  const saveHotel = async () => {
    localStorage.setItem('nh_hotel_name', hotelName)
    localStorage.setItem('nh_hotel_address', hotelAddress)
    if (workspace) {
      try { await update({ name: hotelName, address: hotelAddress }) }
      catch { toast.error('Could not sync to workspace') }
    } else {
      toast.success('Hotel info saved')
    }
  }

  const saveBulkRates = async () => {
    setSaving(true)
    try {
      for (const [type, rate] of Object.entries(defaultRates)) {
        const { error } = await supabase.from('rooms').update({ base_rate: rate }).eq('room_type', type)
        if (error) throw error
      }
      toast.success('Default rates updated for all rooms')
    } catch (e) {
      toast.error(e.message || 'Failed to update rates')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!pwd.newPwd || pwd.newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (pwd.newPwd !== pwd.confirm) { toast.error('Passwords do not match'); return }
    setChangingPwd(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd.newPwd })
      if (error) throw error
      toast.success('Password changed successfully')
      setPwd({ newPwd: '', confirm: '' })
    } catch (e) {
      toast.error(e.message || 'Failed to change password')
    } finally {
      setChangingPwd(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error('Enter a valid email address'); return
    }
    setInviting(true)
    try {
      const { invite: inv, emailSent } = await invite(inviteEmail.trim().toLowerCase(), inviteRole)
      if (emailSent) {
        toast.success(`Invite email sent to ${inviteEmail} ✉️`)
      } else {
        toast.success(`Invite created for ${inviteEmail}`)
        toast(`Email delivery unavailable — copy the invite link manually`, { icon: '⚠️', duration: 6000 })
      }
      setInviteEmail('')
      setInviteOpen(false)
    } catch (e) {
      toast.error(e.message || 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    try {
      await revoke(revokeTarget.id)
      setRevokeTarget(null)
    } catch (e) {
      toast.error(e.message || 'Failed to revoke access')
    }
  }

  const handleCancelInvite = async (id) => {
    try { await cancelPendingInvite(id) }
    catch (e) { toast.error(e.message || 'Failed to cancel invite') }
  }

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/join?token=${token}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedInvite(token)
      toast.success('Invite link copied!')
      setTimeout(() => setCopiedInvite(null), 3000)
    })
  }

  const rateLabels = {
    non_ac_standard: 'Non-AC Standard',
    non_ac_deluxe: 'Non-AC Deluxe',
    ac_standard: 'AC Standard',
    ac_deluxe: 'AC Deluxe',
  }

  return (
    <div className="page-container max-w-xl">
      <h1 className="font-display text-xl font-semibold mb-5">Settings</h1>

      {/* ── Hotel Info ── */}
      <div className="card p-4 mb-4">
        <p className="text-sm font-semibold mb-3">Hotel Information</p>
        <div className="space-y-3">
          <div>
            <label className="label">Hotel Name</label>
            <input className="input-field" value={hotelName} onChange={e => setHotelName(e.target.value)} />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input-field" rows={2} value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} />
          </div>
          <button onClick={saveHotel} className="btn-primary flex items-center gap-2 text-sm">
            <Save size={14} /> Save Info
          </button>
        </div>
      </div>

      {/* ── Default Rates ── */}
      <div className="card p-4 mb-4">
        <p className="text-sm font-semibold mb-1">Default Room Rates</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Updates base rate for all existing rooms of each type</p>
        <div className="space-y-2.5">
          {Object.entries(rateLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-3">
              <label className="text-sm flex-1">{label}</label>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>₹</span>
                <input type="number" className="input-field pl-7 py-2 text-sm" value={defaultRates[type]}
                  onChange={e => setDefaultRates(r => ({ ...r, [type]: parseFloat(e.target.value) || 0 }))} min="0" />
              </div>
            </div>
          ))}
        </div>
        <button onClick={saveBulkRates} disabled={saving} className="btn-primary mt-3 flex items-center gap-2 text-sm">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Apply Rates
        </button>
      </div>

      {/* ── Multi-Owner Workspace ── */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2"><Users size={15} className="text-brand" /> Team Access</p>
            {workspace && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Workspace: <span className="font-medium">{workspace.name}</span>
              </p>
            )}
          </div>
          {isOwner && (
            <button onClick={() => setInviteOpen(true)} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
              <UserPlus size={13} /> Invite
            </button>
          )}
        </div>

        {wsLoading ? (
          <div className="flex justify-center py-4"><Spinner size={20} /></div>
        ) : (
          <div className="space-y-2">
            {/* Active members */}
            {members.length === 0 && invites.length === 0 ? (
              <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>
                Only you have access. Invite another owner to collaborate.
              </p>
            ) : (
              <>
                {members.map(m => {
                  const isMe = m.user_id === user?.id || m.email === user?.email
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/3 dark:hover:bg-white/3 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {m.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{m.email}</p>
                          {isMe && <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">You</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusDot status={m.status} />
                          <RoleBadge role={m.role} />
                          {m.joined_at && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Joined {formatDate(m.joined_at)}</span>
                          )}
                        </div>
                      </div>
                      {isOwner && !isMe && (
                        <button
                          onClick={() => setRevokeTarget(m)}
                          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-400 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Revoke access"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Pending invites */}
                {invites.length > 0 && (
                  <>
                    <p className="text-xs font-medium pt-2 pb-1" style={{ color: 'var(--text-muted)' }}>PENDING INVITES</p>
                    {invites.map(inv => (
                      <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center flex-shrink-0">
                          <Mail size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{inv.email}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <RoleBadge role={inv.role} />
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                              <Clock size={10} /> Expires {formatDate(inv.expires_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => copyInviteLink(inv.token)}
                            className="p-2 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors text-amber-600"
                            title="Copy invite link"
                          >
                            {copiedInvite === inv.token ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                          <button
                            onClick={() => handleCancelInvite(inv.id)}
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-400 hover:text-red-500 transition-colors"
                            title="Cancel invite"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            <button onClick={refetch} className="flex items-center gap-1.5 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
        )}

        {!isOwner && myMember && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-brand/5 border border-brand/10 text-xs" style={{ color: 'var(--text-muted)' }}>
            Only workspace owners can invite or remove team members.
          </div>
        )}
      </div>

      {/* ── Appearance ── */}
      <div className="card p-4 mb-4">
        <p className="text-sm font-semibold mb-3">Appearance</p>
        <button onClick={toggle} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <span className="text-sm font-medium">Theme</span>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{dark ? 'Dark' : 'Light'}</span>
            {dark ? <Moon size={16} className="text-brand" /> : <Sun size={16} className="text-brand" />}
          </div>
        </button>
      </div>

      {/* ── Change Password ── */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound size={16} className="text-brand" />
          <p className="text-sm font-semibold">Change Password</p>
        </div>
        <div className="space-y-2.5">
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input-field" placeholder="Min 6 characters" value={pwd.newPwd} onChange={e => setPwd(p => ({ ...p, newPwd: e.target.value }))} />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" className="input-field" placeholder="Repeat new password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} />
          </div>
          <button onClick={changePassword} disabled={changingPwd} className="btn-primary flex items-center gap-2 text-sm">
            {changingPwd && <Loader2 size={14} className="animate-spin" />}
            Change Password
          </button>
        </div>
      </div>

      {/* ── About ── */}
      <div className="card p-4">
        <p className="text-sm font-semibold mb-2">About</p>
        <div className="space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>App: Natural Heaven Hotel Manager</p>
          <p>Version: 2.0.0</p>
          <p>Logged in as: {user?.email}</p>
          {myMember && <p>Role: <RoleBadge role={myMember.role} /></p>}
          <p className="text-xs pt-1">Built with React, Supabase & Cloudinary</p>
        </div>
      </div>

      {/* ── Invite Modal ── */}
      <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteEmail('') }} title="Invite Team Member">
        <div className="space-y-4">
          <div className="px-4 py-3 rounded-xl bg-brand/5 border border-brand/10 text-xs" style={{ color: 'var(--text-muted)' }}>
            <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>How it works</p>
            <p>Enter the email address of the person you want to invite. They need to create an account in Supabase Auth (or you can add them there). Once they sign in, they'll automatically join this workspace and see all the same data.</p>
          </div>
          <div>
            <label className="label">Email Address *</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input-field pl-9"
                type="email"
                placeholder="co-owner@gmail.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
            </div>
          </div>
          <div>
            <label className="label">Role</label>
            <div className="flex gap-2">
              {['owner', 'manager'].map(r => (
                <button
                  key={r}
                  onClick={() => setInviteRole(r)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all border ${inviteRole === r ? 'bg-brand text-white border-brand' : 'border-[var(--border)]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {inviteRole === 'owner'
                ? 'Full access: check-in, check-out, rooms, guests, reports, invite others.'
                : 'Standard access: check-in, check-out, rooms, guests. No settings or team management.'}
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setInviteOpen(false); setInviteEmail('') }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleInvite} disabled={inviting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {inviting ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><UserPlus size={14} /> Send Invite</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Revoke Confirm Modal ── */}
      <Modal open={!!revokeTarget} onClose={() => setRevokeTarget(null)} title="Revoke Access">
        {revokeTarget && (
          <div>
            <p className="text-sm mb-1">Remove <strong>{revokeTarget.email}</strong> from the workspace?</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>They will lose access immediately. You can re-invite them later.</p>
            <div className="flex gap-3">
              <button onClick={() => setRevokeTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleRevoke} className="flex-1 bg-red-500 text-white rounded-xl px-4 py-3 text-sm font-medium">
                Revoke Access
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
