import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the requesting user is szef
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if requesting user is szef
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'szef')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Unauthorized - only szef can delete users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the user ID to delete
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prevent self-deletion
    if (userId === requestingUser.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Delete related data first
    console.log('Deleting data for user:', userId)
    
    // Delete documents created by user
    const { error: docError } = await supabaseAdmin.from('documents').delete().eq('created_by', userId)
    if (docError) console.error('Error deleting documents:', docError)
    
    // Delete user roles
    const { error: roleError } = await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)
    if (roleError) console.error('Error deleting user_roles:', roleError)
    
    // Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId)
    await supabaseAdmin.from('notifications').delete().eq('created_by', userId)
    
    // Delete team messages and reactions
    await supabaseAdmin.from('message_reactions').delete().eq('user_id', userId)
    await supabaseAdmin.from('team_messages').delete().eq('user_id', userId)
    
    // Delete task comments
    await supabaseAdmin.from('task_comments').delete().eq('user_id', userId)
    
    // Unassign tasks (don't delete - just clear assignment)
    await supabaseAdmin.from('tasks').update({ assigned_to: null }).eq('assigned_to', userId)
    await supabaseAdmin.from('tasks').update({ completed_by: null }).eq('completed_by', userId)
    
    // Delete tasks created by user that have no client
    await supabaseAdmin.from('tasks').delete().eq('created_by', userId).is('client_id', null)
    
    // Unassign clients
    await supabaseAdmin.from('clients').update({ assigned_to: null }).eq('assigned_to', userId)
    
    // Delete profile
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
    if (profileError) console.error('Error deleting profile:', profileError)

    // Delete the user from auth.users
    console.log('Deleting user from auth:', userId)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return new Response(JSON.stringify({ error: 'Failed to delete user from auth' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
