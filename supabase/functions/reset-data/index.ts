import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      return new Response(JSON.stringify({ error: 'Only szef can reset data' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { confirmPhrase, includeFiles = false, excludeClientIds = [] } = await req.json();

    // Require confirmation phrase
    if (confirmPhrase !== 'RESET DANYCH') {
      return new Response(JSON.stringify({ error: 'Invalid confirmation phrase' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting data reset...');
    console.log('Include files:', includeFiles);
    console.log('Exclude client IDs:', excludeClientIds);

    // Get lead IDs for excluded clients (to preserve their leads too)
    let excludeLeadIds: string[] = [];
    if (excludeClientIds.length > 0) {
      const { data: excludedClients } = await supabase
        .from('clients')
        .select('lead_id')
        .in('id', excludeClientIds);
      
      excludeLeadIds = (excludedClients || [])
        .filter(c => c.lead_id)
        .map(c => c.lead_id as string);
      
      console.log('Exclude lead IDs:', excludeLeadIds);
    }

    const results: Record<string, { deleted: number; error?: string }> = {};

    // Helper function to delete with exclusions
    const deleteWithExclusion = async (
      table: string, 
      clientField?: string, 
      leadField?: string
    ) => {
      try {
        let query = supabase.from(table).delete();
        
        // Build exclusion conditions
        if (clientField && excludeClientIds.length > 0) {
          // Delete records NOT belonging to excluded clients
          query = query.not(clientField, 'in', `(${excludeClientIds.join(',')})`);
        }
        
        if (leadField && excludeLeadIds.length > 0) {
          query = query.not(leadField, 'in', `(${excludeLeadIds.join(',')})`);
        }
        
        // Need to have at least one condition for delete
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Count before delete
        let countQuery = supabase.from(table).select('*', { count: 'exact', head: true });
        if (clientField && excludeClientIds.length > 0) {
          countQuery = countQuery.not(clientField, 'in', `(${excludeClientIds.join(',')})`);
        }
        if (leadField && excludeLeadIds.length > 0) {
          countQuery = countQuery.not(leadField, 'in', `(${excludeLeadIds.join(',')})`);
        }
        
        const { count } = await countQuery;
        const { error } = await query;
        
        if (error) {
          results[table] = { deleted: 0, error: error.message };
          console.error(`Error deleting ${table}:`, error.message);
        } else {
          results[table] = { deleted: count || 0 };
          console.log(`Deleted ${count || 0} records from ${table}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results[table] = { deleted: 0, error: errorMessage };
        console.error(`Error deleting ${table}:`, err);
      }
    };

    // Helper for tables without client/lead reference
    const deleteAll = async (table: string) => {
      try {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          results[table] = { deleted: 0, error: error.message };
          console.error(`Error deleting ${table}:`, error.message);
        } else {
          results[table] = { deleted: count || 0 };
          console.log(`Deleted ${count || 0} records from ${table}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results[table] = { deleted: 0, error: errorMessage };
        console.error(`Error deleting ${table}:`, err);
      }
    };

    // Delete in correct order (child tables first)
    // Tables with client_id reference
    await deleteWithExclusion('campaign_metrics', undefined, undefined); // Will handle via campaigns
    await deleteWithExclusion('client_app_activity', 'client_id', undefined);
    await deleteWithExclusion('client_app_documents', 'client_id', undefined);
    await deleteWithExclusion('client_app_notifications', 'client_id', undefined);
    await deleteWithExclusion('client_visibility_settings', 'client_id', undefined);
    await deleteWithExclusion('pending_final_invoices', 'client_id', undefined);
    await deleteWithExclusion('payments', 'client_id', undefined);
    await deleteWithExclusion('subscription_codes', 'client_id', undefined);
    
    // Tables with lead_id reference  
    await deleteWithExclusion('lead_interactions', undefined, 'lead_id');
    await deleteWithExclusion('auto_followup_logs', undefined, 'lead_id');
    
    // Documents can have both client_id and lead_id
    if (excludeClientIds.length > 0 || excludeLeadIds.length > 0) {
      try {
        let query = supabase.from('documents').delete();
        
        // Complex condition: delete if NOT (client_id in excluded OR lead_id in excluded)
        if (excludeClientIds.length > 0) {
          query = query.not('client_id', 'in', `(${excludeClientIds.join(',')})`);
        }
        if (excludeLeadIds.length > 0) {
          query = query.not('lead_id', 'in', `(${excludeLeadIds.join(',')})`);
        }
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        
        const { count } = await supabase.from('documents').select('*', { count: 'exact', head: true });
        const { error } = await query;
        
        results['documents'] = error 
          ? { deleted: 0, error: error.message }
          : { deleted: count || 0 };
      } catch (err) {
        results['documents'] = { deleted: 0, error: String(err) };
      }
    } else {
      await deleteAll('documents');
    }
    
    // Campaigns with client_id
    await deleteWithExclusion('campaigns', 'client_id', undefined);
    
    // Tasks with client_id
    await deleteWithExclusion('tasks', 'client_id', undefined);
    
    // Calendar events can have client_id and lead_id
    if (excludeClientIds.length > 0 || excludeLeadIds.length > 0) {
      try {
        let query = supabase.from('calendar_events').delete();
        if (excludeClientIds.length > 0) {
          query = query.not('client_id', 'in', `(${excludeClientIds.join(',')})`);
        }
        if (excludeLeadIds.length > 0) {
          query = query.not('lead_id', 'in', `(${excludeLeadIds.join(',')})`);
        }
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        
        const { count } = await supabase.from('calendar_events').select('*', { count: 'exact', head: true });
        const { error } = await query;
        
        results['calendar_events'] = error 
          ? { deleted: 0, error: error.message }
          : { deleted: count || 0 };
      } catch (err) {
        results['calendar_events'] = { deleted: 0, error: String(err) };
      }
    } else {
      await deleteAll('calendar_events');
    }
    
    // Tables without client/lead reference - always delete all
    await deleteAll('announcement_comments');
    await deleteAll('announcements');
    await deleteAll('message_reactions');
    await deleteAll('task_comments');
    await deleteAll('notifications');
    await deleteAll('team_messages');
    await deleteAll('email_templates');
    await deleteAll('sms_templates');
    await deleteAll('social_media_posts');
    await deleteAll('client_app_content');
    await deleteAll('monthly_reports');
    
    // Finally main entities
    if (excludeClientIds.length > 0) {
      // Delete clients NOT in excluded list
      try {
        const { count } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .not('id', 'in', `(${excludeClientIds.join(',')})`);
        
        const { error } = await supabase
          .from('clients')
          .delete()
          .not('id', 'in', `(${excludeClientIds.join(',')})`);
        
        results['clients'] = error 
          ? { deleted: 0, error: error.message }
          : { deleted: count || 0 };
        
        console.log(`Deleted ${count || 0} clients (preserved ${excludeClientIds.length})`);
      } catch (err) {
        results['clients'] = { deleted: 0, error: String(err) };
      }
    } else {
      await deleteAll('clients');
    }
    
    if (excludeLeadIds.length > 0) {
      // Delete leads NOT in excluded list
      try {
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .not('id', 'in', `(${excludeLeadIds.join(',')})`);
        
        const { error } = await supabase
          .from('leads')
          .delete()
          .not('id', 'in', `(${excludeLeadIds.join(',')})`);
        
        results['leads'] = error 
          ? { deleted: 0, error: error.message }
          : { deleted: count || 0 };
        
        console.log(`Deleted ${count || 0} leads (preserved ${excludeLeadIds.length})`);
      } catch (err) {
        results['leads'] = { deleted: 0, error: String(err) };
      }
    } else {
      await deleteAll('leads');
    }

    // Delete storage files if requested (only for non-excluded clients)
    if (includeFiles) {
      try {
        // Delete document thumbnails (can't filter, delete all for now)
        if (excludeClientIds.length === 0) {
          const { data: thumbnails } = await supabase.storage.from('document-thumbnails').list();
          if (thumbnails && thumbnails.length > 0) {
            const paths = thumbnails.map(f => f.name);
            await supabase.storage.from('document-thumbnails').remove(paths);
            console.log(`Deleted ${paths.length} thumbnail files`);
          }
        }

        // Delete client documents (only for non-excluded clients)
        const { data: clientFolders } = await supabase.storage.from('client_documents').list();
        if (clientFolders) {
          for (const folder of clientFolders) {
            // Skip folders for excluded clients
            if (excludeClientIds.includes(folder.name)) {
              console.log(`Skipping client_documents/${folder.name} (excluded)`);
              continue;
            }
            
            const { data: files } = await supabase.storage.from('client_documents').list(folder.name);
            if (files && files.length > 0) {
              const paths = files.map(f => `${folder.name}/${f.name}`);
              await supabase.storage.from('client_documents').remove(paths);
              console.log(`Deleted ${paths.length} files from client_documents/${folder.name}`);
            }
          }
        }

        // Delete social media files (always delete all)
        const { data: socialFiles } = await supabase.storage.from('social-media').list();
        if (socialFiles && socialFiles.length > 0) {
          const paths = socialFiles.map(f => f.name);
          await supabase.storage.from('social-media').remove(paths);
          console.log(`Deleted ${paths.length} social media files`);
        }
      } catch (storageError) {
        console.error('Storage deletion error:', storageError);
      }
    }

    const totalDeleted = Object.values(results).reduce((sum, r) => sum + r.deleted, 0);
    console.log(`Reset complete. Total deleted: ${totalDeleted}`);

    return new Response(JSON.stringify({ 
      success: true, 
      totalDeleted,
      preservedClients: excludeClientIds.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Reset error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
