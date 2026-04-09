import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Leaf, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill all fields'); return }
    try {
      setLoading(true)
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      if (err.message?.includes('Invalid')) toast.error('Invalid credentials. Please try again.')
      else if (err.message?.includes('fetch') || err.message?.includes('network')) toast.error('No internet connection')
      else toast.error(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

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

        {/* Card */}
        <div className="card p-6">
          <h2 className="font-semibold text-base mb-5">Owner Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="owner@naturalheaven.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Hotel Management System v1.0
        </p>
      </div>
    </div>
  )
}
