import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get table sizes
    const { data: tableSizes, error: tableSizesError } = await supabase.rpc('get_table_sizes');
    
    if (tableSizesError) {
      console.log('Table sizes RPC not available, using estimation');
    }

    // Count records in main tables to estimate size
    const tables = [
      'leads', 'clients', 'campaigns', 'documents', 'tasks', 
      'notifications', 'team_messages', 'calendar_events',
      'lead_interactions', 'payments', 'campaign_metrics'
    ];

    const counts: Record<string, number> = {};
    let totalEstimatedBytes = 0;

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        counts[table] = count;
        
        // Estimate size based on table type
        let avgRowSize = 500; // default bytes per row
        if (table === 'documents') avgRowSize = 20000; // JSONB data
        if (table === 'team_messages') avgRowSize = 1000;
        if (table === 'lead_interactions') avgRowSize = 800;
        if (table === 'notifications') avgRowSize = 600;
        
        totalEstimatedBytes += count * avgRowSize;
      }
    }

    // Convert to MB
    const estimatedSizeMB = totalEstimatedBytes / (1024 * 1024);
    const limitMB = 500; // Free tier limit
    const usagePercent = (estimatedSizeMB / limitMB) * 100;

    // Determine status
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (usagePercent >= 90) {
      status = 'critical';
    } else if (usagePercent >= 70) {
      status = 'warning';
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100,
          limitMB,
          usagePercent: Math.round(usagePercent * 100) / 100,
          status,
          tableCounts: counts,
          largestTables: Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([table, count]) => ({ table, count }))
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking database size:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
