/**
 * Workspace Service — Natural Heaven
 * Multi-owner workspace management + email invite via Resend
 */

import { supabase } from './supabase'

/** Call the send-invite Edge Function to email the invite link */
async function sendInviteEmail({ email, role, token, invitedByEmail, workspaceName }) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.warn('[Invite] Supabase URL not set — skipping email')
      return false
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/send-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email,
        role,
        token,
        invitedBy: invitedByEmail,
        workspaceName,
      }),
    })

    const data = await res.json()
    if (data.success) {
      console.info('[Invite] Email sent to', email)
      return true
    } else {
      console.warn('[Invite] Email failed:', data.error)
      return false
    }
  } catch (e) {
    console.warn('[Invite] Edge function unreachable:', e.message)
    return false
  }
}

/**
 * Get or create workspace for current user.
 * Called on every login — auto-joins if invite exists.
 */
export async function getOrCreateWorkspace(userId, userEmail) {
  // Already a member?
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('*, workspaces(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (existing?.workspaces) return { workspace: existing.workspaces, member: existing }

  // Pending invite for this email?
  const { data: invite } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('email', userEmail)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .single()

  if (invite) {
    // Accept invite — join the workspace
    await supabase
      .from('workspace_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    const { data: member } = await supabase
      .from('workspace_members')
      .insert([{
        workspace_id: invite.workspace_id,
        user_id: userId,
        email: userEmail,
        role: invite.role,
        status: 'active',
        invited_by: invite.invited_by,
        joined_at: new Date().toISOString(),
      }])
      .select('*, workspaces(*)')
      .single()

    return { workspace: member?.workspaces, member }
  }

  // No workspace — create one (primary owner first login)
  const { data: workspace } = await supabase
    .from('workspaces')
    .insert([{
      name: localStorage.getItem('nh_hotel_name') || 'Natural Heaven',
      address: localStorage.getItem('nh_hotel_address') || 'Bondarwadi, Mahabaleshwar',
      created_by: userId,
    }])
    .select()
    .single()

  const { data: member } = await supabase
    .from('workspace_members')
    .insert([{
      workspace_id: workspace.id,
      user_id: userId,
      email: userEmail,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    }])
    .select()
    .single()

  return { workspace, member }
}

export async function getWorkspaceMembers(workspaceId) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .neq('status', 'revoked')
    .order('invited_at')
  if (error) throw error
  return data || []
}

export async function getWorkspaceInvites(workspaceId) {
  const { data, error } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Invite a member — creates DB record + sends real email via Edge Function
 * Returns { invite, emailSent }
 */
export async function inviteMember(workspaceId, email, role, invitedByUserId, invitedByEmail, workspaceName) {
  // Already active member?
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id, status')
    .eq('workspace_id', workspaceId)
    .eq('email', email)
    .limit(1)
    .single()

  if (existing?.status === 'active') throw new Error('This person is already a member.')
  if (existing?.status === 'revoked') throw new Error('This user was revoked. Add them directly via SQL or re-invite.')

  // Existing pending invite — refresh it
  const { data: existingInvite } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('email', email)
    .is('accepted_at', null)
    .limit(1)
    .single()

  let invite
  if (existingInvite) {
    const { data, error } = await supabase
      .from('workspace_invites')
      .update({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        role,
      })
      .eq('id', existingInvite.id)
      .select()
      .single()
    if (error) throw error
    invite = data
  } else {
    const { data, error } = await supabase
      .from('workspace_invites')
      .insert([{ workspace_id: workspaceId, email, role, invited_by: invitedByUserId }])
      .select()
      .single()
    if (error) {
      if (error.code === '23505') throw new Error('An invite for this email already exists.')
      throw error
    }
    invite = data
  }

  // Send invite email
  const emailSent = await sendInviteEmail({
    email,
    role,
    token: invite.token,
    invitedByEmail,
    workspaceName,
  })

  return { invite, emailSent }
}

/** Accept invite by token — called from /join page */
export async function acceptInviteByToken(token, userId, userEmail) {
  // Find valid invite
  const { data: invite, error } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !invite) {
    throw new Error('This invite link is invalid or has expired.')
  }

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error(`This invite is for ${invite.email}. Please sign in with that email.`)
  }

  // Mark invite accepted
  await supabase
    .from('workspace_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  // Add to workspace_members (upsert safe)
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .upsert([{
      workspace_id: invite.workspace_id,
      user_id: userId,
      email: userEmail,
      role: invite.role,
      status: 'active',
      invited_by: invite.invited_by,
      joined_at: new Date().toISOString(),
    }], { onConflict: 'workspace_id,user_id' })
    .select()
    .single()

  if (memberError) throw memberError
  return member
}

export async function revokeMember(memberId) {
  const { error } = await supabase
    .from('workspace_members')
    .update({ status: 'revoked' })
    .eq('id', memberId)
  if (error) throw error
}

export async function cancelInvite(inviteId) {
  const { error } = await supabase.from('workspace_invites').delete().eq('id', inviteId)
  if (error) throw error
}

export async function updateWorkspace(workspaceId, updates) {
  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Validate a token without accepting it (used on /join page load) */
export async function validateInviteToken(token) {
  const { data, error } = await supabase
    .from('workspace_invites')
    .select('*, workspaces(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return { valid: false }
  return { valid: true, invite: data }
}
