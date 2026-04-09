import { useState, useRef, useEffect } from 'react'
import { Phone, ShieldCheck, ShieldX, Loader2, RefreshCw, X } from 'lucide-react'
import { sendOTP, verifyOTP, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from '../../lib/otpService'
import toast from 'react-hot-toast'

/**
 * Props:
 *  mobile          string  — the mobile number to verify
 *  onVerified      fn()    — called when OTP confirmed
 *  onSkip          fn()    — called when user skips
 *  disabled        bool    — disable if mobile not valid yet
 */
export default function MobileVerification({ mobile, onVerified, onSkip, disabled }) {
  const [phase, setPhase] = useState('idle') // idle | sending | otp_sent | verifying | verified
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [devOtp, setDevOtp] = useState('') // shown only in dev mode
  const [countdown, setCountdown] = useState(0) // resend cooldown
  const inputRefs = useRef([])
  const timerRef = useRef(null)

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), [])

  const startCountdown = () => {
    setCountdown(OTP_RESEND_COOLDOWN_SECONDS)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleSend = async () => {
    setError('')
    setOtp(['', '', '', '', '', ''])
    setPhase('sending')
    const result = await sendOTP(mobile)
    if (!result.success) {
      setError(result.error || 'Failed to send OTP')
      setPhase('idle')
      return
    }
    setPhase('otp_sent')
    startCountdown()
    if (result.devOtp) {
      setDevOtp(result.devOtp)
      toast(`Dev mode — OTP: ${result.devOtp}`, { icon: '🔐', duration: 15000 })
    }
    toast.success(`OTP sent to +91 ${mobile}`)
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return // digits only
    const next = [...otp]
    next[index] = value
    setOtp(next)
    setError('')
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Enter all 6 digits'); return }
    setPhase('verifying')
    setError('')
    const result = await verifyOTP(mobile, code)
    if (!result.success) {
      setError(result.error)
      setPhase('otp_sent')
      return
    }
    setPhase('verified')
    setDevOtp('')
    toast.success('Mobile verified successfully!')
    onVerified()
  }

  const handleClear = () => {
    setPhase('idle')
    setOtp(['', '', '', '', '', ''])
    setError('')
    setDevOtp('')
    clearInterval(timerRef.current)
    setCountdown(0)
  }

  if (phase === 'verified') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <ShieldCheck size={16} className="text-green-600 flex-shrink-0" />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">Mobile verified</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Verify button / status row */}
      {phase === 'idle' && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex-1">
            <ShieldX size={14} className="text-amber-600 flex-shrink-0" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Not verified</span>
          </div>
          <button
            onClick={handleSend}
            disabled={disabled}
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 disabled:opacity-40"
          >
            <Phone size={13} /> Verify Mobile
          </button>
          <button
            onClick={onSkip}
            className="text-xs px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Skip
          </button>
        </div>
      )}

      {phase === 'sending' && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={14} className="animate-spin" />
          Sending OTP to +91 {mobile}…
        </div>
      )}

      {(phase === 'otp_sent' || phase === 'verifying') && (
        <div className="card p-4 space-y-4 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Enter OTP</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Sent to +91 {mobile} · valid {OTP_EXPIRY_MINUTES} min
              </p>
            </div>
            <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* DEV mode hint */}
          {devOtp && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400 font-mono">
              🔐 Dev OTP: <strong>{devOtp}</strong>
            </div>
          )}

          {/* 6-box OTP input */}
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className={`w-11 h-12 text-center text-xl font-bold rounded-xl border transition-all focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none ${
                  error ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : ''
                }`}
                style={{
                  background: 'var(--bg)',
                  borderColor: error ? undefined : 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={otp.join('').length < 6 || phase === 'verifying'}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {phase === 'verifying'
              ? <><Loader2 size={15} className="animate-spin" /> Verifying…</>
              : <><ShieldCheck size={15} /> Confirm OTP</>
            }
          </button>

          {/* Resend */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Resend in {countdown}s
              </p>
            ) : (
              <button
                onClick={handleSend}
                className="text-xs text-brand font-medium flex items-center gap-1 mx-auto hover:underline"
              >
                <RefreshCw size={11} /> Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
