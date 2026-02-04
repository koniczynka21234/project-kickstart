import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientData {
  client: {
    id: string;
    salon_name: string;
    owner_name: string | null;
    industry: string | null;
    city: string | null;
  };
  guardian: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    position: string | null;
  } | null;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    objective: string | null;
    start_date: string;
    end_date: string | null;
    budget: number | null;
  }>;
  documents: Array<{
    id: string;
    title: string;
    type: string;
    file_url: string;
    created_at: string;
  }>;
  visibility: {
    show_campaigns: boolean;
    show_guardian: boolean;
    show_documents: boolean;
    visible_document_types: string[];
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get subscription_code from query params or body
    let subscriptionCode: string | null = null;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      subscriptionCode = url.searchParams.get('subscription_code');
    } else if (req.method === 'POST') {
      const body = await req.json();
      subscriptionCode = body.subscription_code;
    }

    if (!subscriptionCode) {
      return new Response(
        JSON.stringify({ error: 'subscription_code is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching client data for subscription_code: ${subscriptionCode}`);

    // Verify subscription code and get client
    const { data: codeData, error: codeError } = await supabase
      .from('subscription_codes')
      .select(`
        id,
        client_id,
        is_active,
        valid_until,
        clients (
          id,
          salon_name,
          owner_name,
          industry,
          city,
          assigned_to
        )
      `)
      .eq('code', subscriptionCode)
      .single();

    if (codeError || !codeData) {
      console.error('Subscription code not found:', codeError);
      return new Response(
        JSON.stringify({ error: 'Invalid subscription code' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if code is active and not expired
    if (!codeData.is_active) {
      return new Response(
        JSON.stringify({ error: 'Subscription code is inactive' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const validUntil = new Date(codeData.valid_until);
    if (validUntil < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Subscription code has expired' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const client = codeData.clients as any;
    if (!client) {
      return new Response(
        JSON.stringify({ error: 'No client associated with this code' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get visibility settings
    const { data: visibilityData } = await supabase
      .from('client_visibility_settings')
      .select('*')
      .eq('client_id', client.id)
      .single();

    const visibility = visibilityData || {
      show_campaigns: true,
      show_guardian: true,
      show_documents: true,
      visible_document_types: ['invoice', 'contract', 'report', 'terms']
    };

    // Build response
    const response: ClientData = {
      client: {
        id: client.id,
        salon_name: client.salon_name,
        owner_name: client.owner_name,
        industry: client.industry,
        city: client.city
      },
      guardian: null,
      campaigns: [],
      documents: [],
      visibility: {
        show_campaigns: visibility.show_campaigns,
        show_guardian: visibility.show_guardian,
        show_documents: visibility.show_documents,
        visible_document_types: visibility.visible_document_types || []
      }
    };

    // Get guardian (assigned_to) if visible
    if (visibility.show_guardian && client.assigned_to) {
      const { data: guardianData } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, position')
        .eq('id', client.assigned_to)
        .single();

      if (guardianData) {
        response.guardian = guardianData;
      }
    }

    // Get campaigns if visible
    if (visibility.show_campaigns) {
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('id, name, status, objective, start_date, end_date, budget')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      response.campaigns = campaignsData || [];
    }

    // Get documents from client_app_documents table (not the old documents table)
    if (visibility.show_documents && visibility.visible_document_types?.length > 0) {
      const { data: documentsData } = await supabase
        .from('client_app_documents')
        .select('id, title, type, file_url, created_at')
        .eq('client_id', client.id)
        .in('type', visibility.visible_document_types)
        .order('created_at', { ascending: false });

      response.documents = documentsData || [];
    }

    console.log(`Successfully fetched data for client: ${client.salon_name}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-client-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
