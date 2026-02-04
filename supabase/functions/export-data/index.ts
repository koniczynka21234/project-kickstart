import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportData {
  exportedAt: string;
  version: string;
  tables: {
    leads: any[];
    clients: any[];
    campaigns: any[];
    campaign_metrics: any[];
    documents: any[];
    tasks: any[];
    task_comments: any[];
    calendar_events: any[];
    notifications: any[];
    team_messages: any[];
    message_reactions: any[];
    announcements: any[];
    announcement_comments: any[];
    email_templates: any[];
    sms_templates: any[];
    lead_interactions: any[];
    payments: any[];
    pending_final_invoices: any[];
    social_media_posts: any[];
    subscription_codes: any[];
    client_app_content: any[];
    client_app_documents: any[];
    client_app_notifications: any[];
    client_app_activity: any[];
    client_visibility_settings: any[];
    monthly_reports: any[];
    auto_followup_logs: any[];
  };
  storage?: {
    documentThumbnails: { path: string; url: string }[];
    clientDocuments: { path: string; url: string }[];
    socialMedia: { path: string; url: string }[];
  };
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
      return new Response(JSON.stringify({ error: 'Only szef can export data' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { includeFiles = false } = await req.json().catch(() => ({}));

    console.log('Starting data export...');
    console.log('Include files:', includeFiles);

    // Fetch all business data tables
    const [
      leads,
      clients,
      campaigns,
      campaign_metrics,
      documents,
      tasks,
      task_comments,
      calendar_events,
      notifications,
      team_messages,
      message_reactions,
      announcements,
      announcement_comments,
      email_templates,
      sms_templates,
      lead_interactions,
      payments,
      pending_final_invoices,
      social_media_posts,
      subscription_codes,
      client_app_content,
      client_app_documents,
      client_app_notifications,
      client_app_activity,
      client_visibility_settings,
      monthly_reports,
      auto_followup_logs,
    ] = await Promise.all([
      supabase.from('leads').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('campaigns').select('*'),
      supabase.from('campaign_metrics').select('*'),
      supabase.from('documents').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('task_comments').select('*'),
      supabase.from('calendar_events').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('team_messages').select('*'),
      supabase.from('message_reactions').select('*'),
      supabase.from('announcements').select('*'),
      supabase.from('announcement_comments').select('*'),
      supabase.from('email_templates').select('*'),
      supabase.from('sms_templates').select('*'),
      supabase.from('lead_interactions').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('pending_final_invoices').select('*'),
      supabase.from('social_media_posts').select('*'),
      supabase.from('subscription_codes').select('*'),
      supabase.from('client_app_content').select('*'),
      supabase.from('client_app_documents').select('*'),
      supabase.from('client_app_notifications').select('*'),
      supabase.from('client_app_activity').select('*'),
      supabase.from('client_visibility_settings').select('*'),
      supabase.from('monthly_reports').select('*'),
      supabase.from('auto_followup_logs').select('*'),
    ]);

    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      tables: {
        leads: leads.data || [],
        clients: clients.data || [],
        campaigns: campaigns.data || [],
        campaign_metrics: campaign_metrics.data || [],
        documents: documents.data || [],
        tasks: tasks.data || [],
        task_comments: task_comments.data || [],
        calendar_events: calendar_events.data || [],
        notifications: notifications.data || [],
        team_messages: team_messages.data || [],
        message_reactions: message_reactions.data || [],
        announcements: announcements.data || [],
        announcement_comments: announcement_comments.data || [],
        email_templates: email_templates.data || [],
        sms_templates: sms_templates.data || [],
        lead_interactions: lead_interactions.data || [],
        payments: payments.data || [],
        pending_final_invoices: pending_final_invoices.data || [],
        social_media_posts: social_media_posts.data || [],
        subscription_codes: subscription_codes.data || [],
        client_app_content: client_app_content.data || [],
        client_app_documents: client_app_documents.data || [],
        client_app_notifications: client_app_notifications.data || [],
        client_app_activity: client_app_activity.data || [],
        client_visibility_settings: client_visibility_settings.data || [],
        monthly_reports: monthly_reports.data || [],
        auto_followup_logs: auto_followup_logs.data || [],
      },
    };

    // Include storage files if requested
    if (includeFiles) {
      const storage: ExportData['storage'] = {
        documentThumbnails: [],
        clientDocuments: [],
        socialMedia: [],
      };

      // List files from document-thumbnails bucket
      const { data: thumbnails } = await supabase.storage.from('document-thumbnails').list();
      if (thumbnails) {
        for (const file of thumbnails) {
          const { data: urlData } = supabase.storage.from('document-thumbnails').getPublicUrl(file.name);
          storage.documentThumbnails.push({ path: file.name, url: urlData.publicUrl });
        }
      }

      // List files from client_documents bucket
      const { data: clientDocs } = await supabase.storage.from('client_documents').list();
      if (clientDocs) {
        for (const item of clientDocs) {
          // This is likely a folder per client
          const { data: clientFiles } = await supabase.storage.from('client_documents').list(item.name);
          if (clientFiles) {
            for (const file of clientFiles) {
              const path = `${item.name}/${file.name}`;
              const { data: signedUrl } = await supabase.storage.from('client_documents').createSignedUrl(path, 3600);
              if (signedUrl) {
                storage.clientDocuments.push({ path, url: signedUrl.signedUrl });
              }
            }
          }
        }
      }

      // List files from social-media bucket
      const { data: socialFiles } = await supabase.storage.from('social-media').list();
      if (socialFiles) {
        for (const file of socialFiles) {
          const { data: urlData } = supabase.storage.from('social-media').getPublicUrl(file.name);
          storage.socialMedia.push({ path: file.name, url: urlData.publicUrl });
        }
      }

      exportData.storage = storage;
    }

    const totalRecords = Object.values(exportData.tables).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`Export complete. Total records: ${totalRecords}`);

    return new Response(JSON.stringify(exportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
