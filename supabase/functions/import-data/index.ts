import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportData {
  exportedAt: string;
  version: string;
  tables: Record<string, any[]>;
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

    // Verify user is szef
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
      return new Response(JSON.stringify({ error: 'Only szef can import data' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const importData: ImportData = await req.json();

    if (!importData.tables || !importData.version) {
      return new Response(JSON.stringify({ error: 'Invalid import file format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting data import...');
    console.log('Export date:', importData.exportedAt);
    console.log('Version:', importData.version);

    // Import tables in correct order (parent tables first)
    const importOrder = [
      // Main entities first
      'leads',
      'clients',
      // Then related tables
      'campaigns',
      'documents',
      'tasks',
      'announcements',
      'team_messages',
      'calendar_events',
      'email_templates',
      'sms_templates',
      'social_media_posts',
      'client_app_content',
      'monthly_reports',
      // Then child tables
      'campaign_metrics',
      'task_comments',
      'lead_interactions',
      'announcement_comments',
      'message_reactions',
      'notifications',
      'payments',
      'pending_final_invoices',
      'subscription_codes',
      'client_app_documents',
      'client_app_notifications',
      'client_app_activity',
      'client_visibility_settings',
      'auto_followup_logs',
    ];

    const results: Record<string, { imported: number; error?: string }> = {};

    for (const table of importOrder) {
      const data = importData.tables[table];
      if (!data || data.length === 0) {
        results[table] = { imported: 0 };
        continue;
      }

      try {
        // Use upsert to handle both new and existing records
        const { error } = await supabase.from(table).upsert(data, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

        if (error) {
          results[table] = { imported: 0, error: error.message };
          console.error(`Error importing ${table}:`, error.message);
        } else {
          results[table] = { imported: data.length };
          console.log(`Imported ${data.length} records to ${table}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results[table] = { imported: 0, error: errorMessage };
        console.error(`Error importing ${table}:`, err);
      }
    }

    const totalImported = Object.values(results).reduce((sum, r) => sum + r.imported, 0);
    console.log(`Import complete. Total imported: ${totalImported}`);

    return new Response(JSON.stringify({ 
      success: true, 
      totalImported,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
