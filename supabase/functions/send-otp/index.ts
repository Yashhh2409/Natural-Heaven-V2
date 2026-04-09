// supabase/functions/send-otp/index.ts
// Deploy: npx supabase functions deploy send-otp
// Secret needed: FAST2SMS_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mobile, otp } = await req.json()

    if (!mobile || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing mobile or otp' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const FAST2SMS_KEY = Deno.env.get('FAST2SMS_API_KEY')
    if (!FAST2SMS_KEY) {
      console.error('FAST2SMS_API_KEY secret not set')
      return new Response(
        JSON.stringify({ success: false, error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending OTP ${otp} to ${mobile}`)

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        route: 'otp',
        variables_values: otp,
        numbers: mobile,
      }).toString(),
    })

    const data = await res.json()
    console.log('Fast2SMS response:', JSON.stringify(data))

    if (data.return === true) {
      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: data.message?.[0] || 'SMS delivery failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (e) {
    console.error('send-otp error:', e)
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
