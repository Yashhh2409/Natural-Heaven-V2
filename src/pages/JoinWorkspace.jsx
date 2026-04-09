import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, Leaf, Loader2, CheckCircle, XCircle, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { validateInviteToken, acceptInviteByToken } from '../lib/workspaceService'
import toast from 'react-hot-toast'

export default function JoinWorkspace() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  // Invite validation state
  const [invite, setInvite] = useState(null)
  const [tokenLoading, setTokenLoading] = useState(true)
  const [tokenError, setTokenError] = useState('')

  // Form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Validate token on mount
  useEffect(() => {
    async function check() {
      if (!token) { setTokenError('No invite token found in the link.'); setTokenLoading(false); return }
      const { valid, invite: inv } = await validateInviteToken(token)
      if (!valid) {
        setTokenError('This invite link is invalid or has already expired. Ask the workspace owner to send a new invite.')
      } else {
        setInvite(inv)
      }
      setTokenLoading(false)
    }
    check()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }

    setSubmitting(true)
    try {
      // Step 1: Sign up the user with Supabase Auth using their invited email
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          // Skip email confirmation — we already verified via invite
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (signUpError) {
        // User might already exist — try signing in instead
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
          // Update their password and sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: invite.email,
            password,
          })
          if (signInError) {
            // Password doesn't match existing — update it
            // Can't update without being signed in — show helpful message
            toast.error('An account with this email already exists. Please use your existing password to sign in, then the workspace will auto-join.')
            setTimeout(() => navigate('/login'), 3000)
            return
          }
          // Signed in successfully with existing account
          const { data: { user } } = await supabase.auth.getUser()
          await acceptInviteByToken(token, user.id, user.email)
          setDone(true)
          toast.success('Joined workspace successfully!')
          setTimeout(() => navigate('/'), 2500)
          return
        }
        throw signUpError
      }

      // Step 2: Accept the invite and add to workspace_members
      const user = signUpData?.user
      if (!user) throw new Error('Account creation failed. Please try again.')

      await acceptInviteByToken(token, user.id, user.email)

      // Step 3: Sign in (signUp doesn't auto-sign-in when email confirmation is enabled)
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: invite.email,
        password,
      })
      if (signInErr) {
        // Email confirmation might be required — show message
        setDone(true)
        toast.success('Account created! Check your email to confirm, then sign in.')
        setTimeout(() => navigate('/login'), 3000)
        return
      }

      setDone(true)
      toast.success('Welcome to Sky View! 🎉')
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      console.error('Join error:', err)
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading token ──
  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Validating invite link…</p>
        </div>
      </div>
    )
  }

  // ── Invalid token ──
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm text-center fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <XCircle size={28} className="text-red-500" />
          </div>
          <h2 className="font-semibold text-lg mb-2">Invalid Invite Link</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{tokenError}</p>
          <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
        </div>
      </div>
    )
  }

  // ── Success ──
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm text-center fade-in">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h2 className="font-semibold text-lg mb-2">You're in! 🎉</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Redirecting to dashboard…</p>
        </div>
      </div>
    )
  }

  // ── Main form ──
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm fade-in">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center mb-4 shadow-lg shadow-brand/30">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Sky View</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Bondarwadi, Mahabaleshwar</p>
        </div>

        {/* Invite info card */}
        <div className="card p-4 mb-4 fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} className="text-brand" />
            </div>
            <div>
              <p className="font-semibold text-sm">You've been invited!</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Workspace: <strong style={{ color: 'var(--text)' }}>{invite?.workspaces?.name || 'Sky View'}</strong>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Email: <strong style={{ color: 'var(--text)' }}>{invite?.email}</strong>
              </p>
              <span className={`badge mt-1.5 capitalize ${invite?.role === 'owner' ? 'bg-brand/10 text-brand' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                {invite?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Password form */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-1">Set Your Password</h2>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Create a password to access the workspace. You'll use your email + this password to sign in anytime.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input-field opacity-70 cursor-not-allowed"
                value={invite?.email || ''}
                disabled
                readOnly
              />
            </div>

            <div>
              <label className="label">New Password *</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password *</label>
              <input
                type="password"
                className="input-field"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && password.length >= 6 && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <CheckCircle size={11} /> Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || password.length < 6 || password !== confirmPassword}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {submitting
                ? <><Loader2 size={15} className="animate-spin" /> Setting up…</>
                : <><CheckCircle size={15} /> Accept Invite & Join</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
