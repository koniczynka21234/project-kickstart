import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isSzefData } = await supabase.rpc('is_szef', { _user_id: user.id });
    if (!isSzefData) {
      return new Response(JSON.stringify({ error: 'Only szef can revert imports' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { importId } = await req.json();

    if (!importId) {
      return new Response(JSON.stringify({ error: 'Missing importId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the import history entry
    const { data: historyEntry, error: fetchError } = await supabase
      .from('import_history')
      .select('*')
      .eq('id', importId)
      .maybeSingle();

    if (fetchError || !historyEntry) {
      return new Response(JSON.stringify({ error: 'Import history entry not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (historyEntry.reverted) {
      return new Response(JSON.stringify({ error: 'This import has already been reverted' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const importedIds = historyEntry.imported_ids as Record<string, string[]>;
    console.log('Reverting import:', importId);

    // Delete in reverse order (child tables first)
    const deleteOrder = [
      'auto_followup_logs',
      'client_visibility_settings',
      'client_app_activity',
      'client_app_notifications',
      'client_app_documents',
      'subscription_codes',
      'pending_final_invoices',
      'payments',
      'notifications',
      'message_reactions',
      'announcement_comments',
      'lead_interactions',
      'task_comments',
      'campaign_metrics',
      'monthly_reports',
      'client_app_content',
      'social_media_posts',
      'sms_templates',
      'email_templates',
      'calendar_events',
      'team_messages',
      'announcements',
      'tasks',
      'documents',
      'campaigns',
      'clients',
      'leads',
    ];

    const results: Record<string, { deleted: number; error?: string }> = {};
    let totalDeleted = 0;

    for (const table of deleteOrder) {
      const ids = importedIds[table];
      if (!ids || ids.length === 0) {
        continue;
      }

      try {
        const { error, count } = await supabase
          .from(table)
          .delete({ count: 'exact' })
          .in('id', ids);

        if (error) {
          results[table] = { deleted: 0, error: error.message };
          console.error(`Error reverting ${table}:`, error.message);
        } else {
          const deletedCount = count || 0;
          results[table] = { deleted: deletedCount };
          totalDeleted += deletedCount;
          console.log(`Reverted ${deletedCount} records from ${table}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results[table] = { deleted: 0, error: errorMessage };
        console.error(`Error reverting ${table}:`, err);
      }
    }

    // Mark as reverted
    await supabase
      .from('import_history')
      .update({ reverted: true, reverted_at: new Date().toISOString() })
      .eq('id', importId);

    console.log(`Revert complete. Total deleted: ${totalDeleted}`);

    return new Response(JSON.stringify({
      success: true,
      totalDeleted,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Revert error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
