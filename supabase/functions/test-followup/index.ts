import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request body for test parameters
    const body = await req.json().catch(() => ({}));
    const { leadId, followupType = "followup_1" } = body;

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: "Missing leadId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found", details: leadError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Testing follow-up for lead: ${lead.salon_name} (${lead.id})`);

    // Get Zoho credentials
    const emailFrom = lead.email_from;
    if (!emailFrom) {
      return new Response(
        JSON.stringify({ error: "Lead has no email_from set" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: credentials, error: credError } = await supabase
      .from("zoho_credentials")
      .select("*")
      .eq("email_account", emailFrom)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: `No Zoho credentials for ${emailFrom}`, details: credError?.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token
    console.log(`Getting Zoho token for ${emailFrom}...`);
    const tokenResponse = await fetch("https://accounts.zoho.eu/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        refresh_token: credentials.refresh_token,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: "Failed to get Zoho access token", details: tokenData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Got access token successfully");

    // Get email template
    const templateName = followupType === "followup_2" ? "follow_up_2" : "follow_up_1";
    const { data: template } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_name", templateName)
      .single();

    const subject = template?.subject || `Re: Współpraca z ${lead.salon_name}`;
    const emailBody = template?.body || `<p>Cześć ${lead.owner_name},</p><p>Test follow-up.</p>`;

    // Replace placeholders
    const finalSubject = subject
      .replace(/\{salon_name\}/g, lead.salon_name || '')
      .replace(/\{owner_name\}/g, lead.owner_name || '')
      .replace(/\{city\}/g, lead.city || '');

    const finalBody = emailBody
      .replace(/\{salon_name\}/g, lead.salon_name || '')
      .replace(/\{owner_name\}/g, lead.owner_name || '')
      .replace(/\{city\}/g, lead.city || '');

    // Get Zoho account ID
    const accountsResponse = await fetch("https://mail.zoho.eu/api/accounts", {
      headers: { Authorization: `Zoho-oauthtoken ${tokenData.access_token}` },
    });

    const accountsData = await accountsResponse.json();
    const account = accountsData.data?.find((acc: any) => acc.primaryEmailAddress === emailFrom);

    if (!account) {
      return new Response(
        JSON.stringify({ error: `Account ${emailFrom} not found in Zoho`, accounts: accountsData.data?.map((a: any) => a.primaryEmailAddress) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email
    console.log(`Sending test email from ${emailFrom} to ${lead.email}...`);
    const sendResponse = await fetch(
      `https://mail.zoho.eu/api/accounts/${account.accountId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromAddress: `"Aurine" <${emailFrom}>`,
          toAddress: lead.email,
          subject: `[TEST] ${finalSubject}`,
          content: `<p><strong>[TO JEST TEST - wysłane ręcznie o ${new Date().toLocaleString('pl-PL')}]</strong></p>${finalBody}`,
          mailFormat: "html",
        }),
      }
    );

    const sendResult = await sendResponse.json();

    if (!sendResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to send email", 
          details: sendResult,
          lead: { id: lead.id, salon_name: lead.salon_name, email: lead.email }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the test send
    await supabase.from("auto_followup_logs").insert({
      lead_id: lead.id,
      lead_name: lead.salon_name,
      email_to: lead.email,
      email_from: emailFrom,
      template_name: `TEST - ${templateName}`,
      followup_type: `test_${followupType}`,
      status: "sent",
    });

    console.log(`Test email sent successfully!`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent to ${lead.email}`,
        details: {
          lead: { id: lead.id, salon_name: lead.salon_name, email: lead.email },
          from: emailFrom,
          subject: `[TEST] ${finalSubject}`,
          sentAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in test-followup:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});