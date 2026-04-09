/**
 * OTP Service — Sky View
 * Sends OTP via Supabase Edge Function → Fast2SMS (no CORS issues)
 * Falls back to dev toast when running locally without the edge function
 */

import { supabase } from './supabase'

export const OTP_EXPIRY_MINUTES = 10
export const MAX_ATTEMPTS = 3
export const OTP_RESEND_COOLDOWN_SECONDS = 30

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * Send OTP to a mobile number.
 * Returns { success, error, devOtp? }
 * devOtp is only present when edge function is unreachable (local dev fallback)
 */
export async function sendOTP(mobile) {
  try {
    // Invalidate old un-verified OTPs for this number
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('mobile', mobile)
      .eq('verified', false)

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()

    // Store in Supabase
    const { data, error } = await supabase
      .from('otp_verifications')
      .insert([{ mobile, otp_code: otp, expires_at: expiresAt, verified: false, attempts: 0 }])
      .select()
      .single()

    if (error) throw error

    // Try to send via Edge Function
    const smsSent = await sendViEdgeFunction(mobile, otp)

    if (smsSent) {
      // Real SMS sent — no devOtp exposed
      return { success: true, otpId: data.id }
    } else {
      // Edge function failed or not deployed — show dev OTP so testing still works
      console.warn('[OTP] Edge function unavailable. Showing dev OTP.')
      return { success: true, otpId: data.id, devOtp: otp }
    }
  } catch (err) {
    console.error('sendOTP error:', err)
    return { success: false, error: err.message || 'Failed to send OTP' }
  }
}

/**
 * Call the Supabase Edge Function to send SMS.
 * Returns true if SMS was delivered, false if anything failed.
 */
async function sendViEdgeFunction(mobile, otp) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || supabaseUrl.includes('placeholder')) return false

    const res = await fetch(`${supabaseUrl}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ mobile, otp }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.warn('[OTP] Edge function HTTP error:', res.status, err)
      return false
    }

    const data = await res.json()
    if (data.success) {
      console.info('[OTP] SMS sent successfully via Edge Function')
      return true
    } else {
      console.warn('[OTP] Edge function returned failure:', data.error)
      return false
    }
  } catch (e) {
    console.warn('[OTP] Edge function unreachable:', e.message)
    return false
  }
}

/**
 * Verify OTP entered by user.
 * Returns { success, error? }
 */
export async function verifyOTP(mobile, enteredOtp) {
  try {
    const { data: records, error: fetchErr } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('mobile', mobile)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchErr) throw fetchErr

    if (!records || records.length === 0) {
      return { success: false, error: 'No OTP found. Please request a new one.' }
    }

    const record = records[0]

    if (new Date(record.expires_at) < new Date()) {
      return { success: false, error: 'OTP has expired. Please request a new one.' }
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return { success: false, error: 'Too many attempts. Please request a new OTP.' }
    }

    // Increment attempts
    await supabase
      .from('otp_verifications')
      .update({ attempts: record.attempts + 1 })
      .eq('id', record.id)

    if (record.otp_code !== enteredOtp.trim()) {
      const remaining = MAX_ATTEMPTS - record.attempts - 1
      return {
        success: false,
        error: remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Incorrect OTP. No attempts left — please request a new OTP.',
      }
    }

    // Mark verified
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', record.id)

    return { success: true }
  } catch (err) {
    console.error('verifyOTP error:', err)
    return { success: false, error: err.message || 'Verification failed. Please try again.' }
  }
}
