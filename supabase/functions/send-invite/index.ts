// supabase/functions/send-invite/index.ts
// Deploy: npx supabase functions deploy send-invite
// Secrets needed: RESEND_API_KEY, APP_URL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role, token, invitedBy, workspaceName } = await req.json()

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173'

    if (!RESEND_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const inviteLink = `${APP_URL}/join?token=${token}`

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e8e8;">
    
    <!-- Header -->
    <div style="background:#6C8EF7;padding:32px 40px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">🍃</span>
      </div>
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Natural Heaven</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Bondarwadi, Mahabaleshwar</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <h2 style="color:#1a1d2e;font-size:20px;margin:0 0 8px;">You're invited! 🎉</h2>
      <p style="color:#8892a4;font-size:15px;margin:0 0 24px;line-height:1.6;">
        <strong style="color:#1a1d2e;">${invitedBy}</strong> has invited you to join the 
        <strong style="color:#1a1d2e;">${workspaceName}</strong> hotel management workspace 
        as a <strong style="color:#6C8EF7;">${role}</strong>.
      </p>

      <div style="background:#F8F7F4;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#8892a4;font-weight:500;">YOUR ROLE</p>
        <p style="margin:0;font-size:15px;color:#1a1d2e;font-weight:600;text-transform:capitalize;">${role}</p>
        <p style="margin:6px 0 0;font-size:13px;color:#8892a4;">
          ${role === 'owner' 
            ? 'Full access — check-in, rooms, guests, reports, billing, team management'
            : 'Operational access — check-in, rooms, guests, food orders, billing'}
        </p>
      </div>

      <p style="color:#8892a4;font-size:14px;margin:0 0 20px;">
        Click the button below to accept the invite and set up your password. 
        This link expires in <strong style="color:#1a1d2e;">7 days</strong>.
      </p>

      <a href="${inviteLink}" 
         style="display:block;background:#6C8EF7;color:#ffffff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-size:15px;font-weight:600;margin-bottom:20px;">
        Accept Invite & Set Password
      </a>

      <p style="color:#c0c0c0;font-size:12px;margin:0;text-align:center;">
        Or copy this link:<br>
        <span style="color:#6C8EF7;word-break:break-all;">${inviteLink}</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="color:#c0c0c0;font-size:12px;margin:0;">
        Natural Heaven Hotel Management · Bondarwadi, Mahabaleshwar<br>
        If you didn't expect this invite, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Natural Heaven <onboarding@resend.dev>',
        to: [email],
        subject: `You're invited to join ${workspaceName} on Natural Heaven`,
        html,
      }),
    })

    const emailData = await emailRes.json()
    console.log('Resend response:', JSON.stringify(emailData))

    if (emailData.id) {
      return new Response(
        JSON.stringify({ success: true, emailId: emailData.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: emailData.message || 'Email failed to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (e) {
    console.error('send-invite error:', e)
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
