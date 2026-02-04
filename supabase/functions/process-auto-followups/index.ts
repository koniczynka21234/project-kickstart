import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache for credentials and access tokens
const credentialsCache: Record<string, { clientId: string; clientSecret: string; refreshToken: string }> = {};
const accessTokenCache: Record<string, { token: string; expiry: number }> = {};

async function getZohoCredentialsFromDB(supabase: any, emailFrom: string): Promise<{ clientId: string; clientSecret: string; refreshToken: string } | null> {
  // Check cache first
  if (credentialsCache[emailFrom]) {
    return credentialsCache[emailFrom];
  }

  const { data, error } = await supabase
    .from("zoho_credentials")
    .select("*")
    .eq("email_account", emailFrom)
    .single();

  if (error || !data) {
    console.error(`No credentials found for ${emailFrom}:`, error?.message);
    return null;
  }

  const credentials = {
    clientId: data.client_id,
    clientSecret: data.client_secret,
    refreshToken: data.refresh_token,
  };

  // Cache it
  credentialsCache[emailFrom] = credentials;
  return credentials;
}

async function getZohoAccessToken(supabase: any, emailFrom: string): Promise<string | null> {
  // Check cache first
  const cached = accessTokenCache[emailFrom];
  if (cached && cached.expiry > Date.now()) {
    return cached.token;
  }

  const credentials = await getZohoCredentialsFromDB(supabase, emailFrom);
  if (!credentials) {
    console.error(`No credentials found in database for ${emailFrom}`);
    return null;
  }

  try {
    console.log(`Getting Zoho token for ${emailFrom}`);
    console.log(`Using credentials - clientId: ${credentials.clientId?.substring(0, 10)}..., refreshToken: ${credentials.refreshToken?.substring(0, 10)}...`);
    
    const response = await fetch("https://accounts.zoho.eu/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
      }),
    });

    const responseText = await response.text();
    console.log(`Zoho token response for ${emailFrom}: status=${response.status}, body=${responseText}`);

    if (!response.ok) {
      console.error(`Failed to get Zoho token for ${emailFrom}:`, responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    
    if (!data.access_token) {
      console.error(`No access_token in response for ${emailFrom}:`, data);
      if (data.error) {
        console.error(`Zoho error: ${data.error} - ${data.error_description || 'No description'}`);
      }
      return null;
    }
    
    // Cache token for 50 minutes (Zoho tokens typically last 1 hour)
    accessTokenCache[emailFrom] = {
      token: data.access_token,
      expiry: Date.now() + 50 * 60 * 1000,
    };
    
    console.log(`Successfully got access token for ${emailFrom}`);
    return data.access_token;
  } catch (e) {
    console.error(`Error getting Zoho token for ${emailFrom}:`, e);
    return null;
  }
}

async function sendEmailViaZoho(
  accessToken: string,
  fromEmail: string,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const accountsResponse = await fetch("https://mail.zoho.eu/api/accounts", {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error("Failed to get Zoho accounts:", errorText);
      return { success: false, error: `Błąd pobierania kont Zoho: ${accountsResponse.status}` };
    }

    const accountsData = await accountsResponse.json();
    console.log("Available accounts:", accountsData.data?.map((a: any) => a.primaryEmailAddress));
    
    const account = accountsData.data?.find((acc: any) => 
      acc.primaryEmailAddress === fromEmail
    );

    if (!account) {
      console.error(`Account ${fromEmail} not found in Zoho accounts`);
      return { success: false, error: `Konto ${fromEmail} nie znalezione w Zoho` };
    }

    // Send with sender name "Aurine" for both accounts
    const sendResponse = await fetch(
      `https://mail.zoho.eu/api/accounts/${account.accountId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromAddress: `"Aurine" <${fromEmail}>`,
          toAddress: to,
          subject,
          content: body,
          mailFormat: "html",
        }),
      }
    );

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("Failed to send email:", errorText);
      return { success: false, error: `Błąd wysyłki: ${sendResponse.status} - ${errorText.substring(0, 100)}` };
    }

    console.log(`Email sent successfully from Aurine <${fromEmail}> to ${to}`);
    return { success: true };
  } catch (e: any) {
    console.error("Send email error:", e);
    return { success: false, error: `Wyjątek: ${e.message}` };
  }
}

// Replace placeholders in email template
function replacePlaceholders(template: string, lead: any): string {
  return template
    .replace(/\{salon_name\}/g, lead.salon_name || '')
    .replace(/\{owner_name\}/g, lead.owner_name || '')
    .replace(/\{city\}/g, lead.city || '')
    .replace(/\{email\}/g, lead.email || '')
    .replace(/\{phone\}/g, lead.phone || '')
    .replace(/\{industry\}/g, lead.industry || '');
}

// Log follow-up send to database
async function logFollowUpSend(
  supabase: any,
  leadId: string,
  leadName: string,
  emailTo: string,
  emailFrom: string,
  templateName: string,
  followupType: string,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  try {
    await supabase.from("auto_followup_logs").insert({
      lead_id: leadId,
      lead_name: leadName,
      email_to: emailTo,
      email_from: emailFrom,
      template_name: templateName,
      followup_type: followupType,
      status,
      error_message: errorMessage || null,
    });
  } catch (e) {
    console.error("Error logging follow-up:", e);
  }
}

// Try to atomically claim a lead for processing (prevents race conditions)
// Returns true if we successfully claimed it, false if another process already has it
async function tryClaimLeadForFollowUp(
  supabase: any,
  leadId: string,
  followupNumber: 1 | 2
): Promise<boolean> {
  const column = followupNumber === 1 ? "email_follow_up_1_sent" : "email_follow_up_2_sent";
  
  // Atomically update only if still false - this prevents race conditions
  const { data, error } = await supabase
    .from("leads")
    .update({ [column]: true })
    .eq("id", leadId)
    .eq(column, false)
    .select("id");

  if (error) {
    console.error(`Error claiming lead ${leadId}:`, error);
    return false;
  }
  
  // If data is empty, another process already claimed it
  return (data?.length || 0) > 0;
}

// Check if follow-up was already logged today (additional safety check)
async function wasFollowUpAlreadySentToday(
  supabase: any,
  leadId: string,
  followupType: string
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("auto_followup_logs")
    .select("id")
    .eq("lead_id", leadId)
    .eq("followup_type", followupType)
    .eq("status", "sent")
    .gte("created_at", `${today}T00:00:00Z`)
    .limit(1);

  if (error) {
    console.error("Error checking duplicate:", error);
    return false;
  }
  return (data?.length || 0) > 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const today = new Date().toISOString().split("T")[0];

    // Fetch email templates from database
    const { data: templates } = await supabase
      .from("email_templates")
      .select("*");

    const templateMap: Record<string, { subject: string; body: string; name: string }> = {};
    for (const t of templates || []) {
      templateMap[t.template_name] = { subject: t.subject, body: t.body, name: t.template_name };
    }

    // Default templates if none in database
    const defaultFollowUp1 = {
      subject: "Re: Współpraca z {salon_name}",
      body: `<p>Cześć {owner_name},</p>
<p>Piszę w nawiązaniu do mojej poprzedniej wiadomości dotyczącej współpracy z salonem {salon_name}.</p>
<p>Czy udało się zapoznać z moją propozycją? Chętnie porozmawiam o szczegółach.</p>
<p>Pozdrawiam,<br/>Zespół Aurine</p>`,
      name: "Follow-up 1 (domyślny)",
    };

    const defaultFollowUp2 = {
      subject: "Ostatnia wiadomość - {salon_name}",
      body: `<p>Cześć {owner_name},</p>
<p>To moja ostatnia wiadomość w tej sprawie. Jeśli nie jesteś zainteresowana współpracą, całkowicie to rozumiem.</p>
<p>Jeśli jednak chciałabyś porozmawiać o tym, jak mogę pomóc {salon_name} pozyskać więcej klientów przez Facebook Ads, daj mi znać.</p>
<p>Pozdrawiam,<br/>Zespół Aurine</p>`,
      name: "Follow-up 2 (domyślny)",
    };

    // Get Follow-up 1 template
    const followUp1Template = templateMap["follow_up_1"] || templateMap["Follow-up 1"] || defaultFollowUp1;
    const followUp2Template = templateMap["follow_up_2"] || templateMap["Follow-up 2"] || defaultFollowUp2;

    // Get leads that need follow-up emails today
    const { data: leadsForFollowUp1 } = await supabase
      .from("leads")
      .select("*")
      .eq("cold_email_sent", true)
      .eq("email_follow_up_1_sent", false)
      .not("email", "is", null)
      .not("email_from", "is", null)
      .lte("email_follow_up_1_date", today)
      .not("status", "in", '("converted","lost")');

    const { data: leadsForFollowUp2 } = await supabase
      .from("leads")
      .select("*")
      .eq("email_follow_up_1_sent", true)
      .eq("email_follow_up_2_sent", false)
      .not("email", "is", null)
      .not("email_from", "is", null)
      .lte("email_follow_up_2_date", today)
      .not("status", "in", '("converted","lost")');

    const results = { sent: 0, failed: 0, skipped: 0, processed: [] as string[] };

    console.log(`Found ${leadsForFollowUp1?.length || 0} leads for Follow-up 1`);
    console.log(`Found ${leadsForFollowUp2?.length || 0} leads for Follow-up 2`);

    // Process Follow-up 1
    for (const lead of leadsForFollowUp1 || []) {
      try {
        // First, try to atomically claim this lead (prevents race conditions)
        const claimed = await tryClaimLeadForFollowUp(supabase, lead.id, 1);
        if (!claimed) {
          console.log(`Skipping lead ${lead.id} - already claimed by another process`);
          results.skipped++;
          continue;
        }

        // Additional check: was it already logged today?
        const alreadySent = await wasFollowUpAlreadySentToday(supabase, lead.id, "followup_1");
        if (alreadySent) {
          console.log(`Skipping lead ${lead.id} - follow-up 1 already sent today (log exists)`);
          results.skipped++;
          continue;
        }

        const emailFrom = lead.email_from;
        console.log(`Processing lead ${lead.id} (${lead.salon_name}) - emailFrom: ${emailFrom}`);
        
        const accessToken = await getZohoAccessToken(supabase, emailFrom);
        
        if (!accessToken) {
          const errorMsg = `Brak tokena dostępu Zoho dla ${emailFrom} - sprawdź dane w tabeli zoho_credentials`;
          console.error(errorMsg);
          // Revert the claim since we failed
          await supabase.from("leads").update({ email_follow_up_1_sent: false }).eq("id", lead.id);
          await logFollowUpSend(supabase, lead.id, lead.salon_name, lead.email, emailFrom, followUp1Template.name || "Follow-up 1", "followup_1", "failed", errorMsg);
          results.failed++;
          continue;
        }
        
        const subject = replacePlaceholders(followUp1Template.subject, lead);
        const body = replacePlaceholders(followUp1Template.body, lead);

        const sendResult = await sendEmailViaZoho(accessToken, emailFrom, lead.email, subject, body);
        
        if (sendResult.success) {
          // Update additional fields (flag already set by claim)
          await supabase.from("leads").update({
            email_follow_up_1_date: today,
            last_contact_date: today,
            follow_up_count: (lead.follow_up_count || 0) + 1,
            last_follow_up_date: today,
          }).eq("id", lead.id);

          await supabase.from("lead_interactions").insert({
            lead_id: lead.id,
            type: "email_follow_up_1",
            title: "Automatyczny Follow-up #1",
            content: `Email wysłany automatycznie z Aurine <${emailFrom}> do ${lead.email}`,
          });

          await logFollowUpSend(supabase, lead.id, lead.salon_name, lead.email, emailFrom, followUp1Template.name || "Follow-up 1", "followup_1", "sent");

          results.sent++;
          results.processed.push(lead.salon_name);
        } else {
          // Revert the claim since sending failed
          await supabase.from("leads").update({ email_follow_up_1_sent: false }).eq("id", lead.id);
          await logFollowUpSend(supabase, lead.id, lead.salon_name, lead.email, emailFrom, followUp1Template.name || "Follow-up 1", "followup_1", "failed", sendResult.error || "Błąd wysyłki Zoho");
          results.failed++;
        }
      } catch (e: any) {
        console.error(`Error processing lead ${lead.id}:`, e);
        // Revert claim on error
        await supabase.from("leads").update({ email_follow_up_1_sent: false }).eq("id", lead.id);
        await logFollowUpSend(supabase, lead.id, lead.salon_name, lead.email, lead.email_from, followUp1Template.name || "Follow-up 1", "followup_1", "failed", e.message);
        results.failed++;
      }
    }

    // Process Follow-up 2
    for (const lead of leadsForFollowUp2 || []) {
      try {
        // First, try to atomically claim this lead (prevents race conditions)
        const claimed = await tryClaimLeadForFollowUp(supabase, lead.id, 2);
        if (!claimed) {
          console.log(`Skipping lead ${lead.id} - already claimed by another process`);
          results.skipped++;
          continue;
        }

        // Additional check: was it already logged today?
        const alreadySent = await wasFollowUpAlreadySentToday(supabase, lead.id, "followup_2");
        if (alreadySent) {
          console.log(`Skipping lead ${lead.id} - follow-up 2 already sent today (log exists)`);
          results.skipped++;
          continue;
        }

        const emailFrom = lead.email_from;
        console.log(`Processing lead ${lead.id} (${lead.salon_name}) - emailFrom: ${emailFrom}`);
        
        const accessToken = await getZohoAccessToken(supabase, emailFrom);
        
        if (!accessToken) {
          const errorMsg = `Brak tokena dostępu Zoho dla ${emailFrom} - sprawdź dane w tabeli zoho_credentials`;
          console.error(errorMsg);
          // Revert the claim since we failed
          await supabase.from("leads").update({ email_follow_up_2_sent: false }).eq("id", lead.id);
          await logFollowUpSend(supabase, lead.id, lead.salon_name, lead.email, emailFrom, followUp2Template.name || "Follow-up 2", "followup_2", "failed", errorMsg);
          results.failed++;
          continue;
        }
        
        const subject = replacePlaceholders(followUp2Template.subject, lead);
        const body = replacePlaceholders(followUp2Template.body, lead);

        const sendResult = await sendEmailViaZoho(accessToken, emailFrom, lead.email, subject, body);
        
        if (sendResult.success) {
          // Update additional fields (flag already set by claim)
          await supabase.from("leads").update({
            email_follow_up_2_date: today,
            last_contact_date: today,
            follow_up_count: (lead.follow_up_count || 0) + 1,
            last_follow_up_date: today,
          }).eq("id", lead.id);

          await supabase.from("lead_interactions").insert({
            lead_id: lead.id,
            type: "email_follow_up_2",
            title: "Automatyczny Follow-up #2",
            content: `Email wysłany automatycznie z Aurine <${emailFrom}> do ${lead.email}`,
          });

          await logFollowUpSend(supabase, lead.id, lead.salon_name, lead.email, emailFrom, followUp2Template.name || "Follow-up 2", "followup_2", "sent");

          results.sent++;
          results.processed.push(lead.salon_name);
        } else {
          // Revert the claim since sending failed
          await supabase.from("leads").update({ email_follow_up_2_sent: false }).eq("id", lead.id);
          await logFollowUpSend(supabase, lead.id, lead.salon_name, lead.email, emailFrom, followUp2Template.name || "Follow-up 2", "followup_2", "failed", sendResult.error || "Błąd wysyłki Zoho");
          results.failed++;
        }
      } catch (e: any) {
        console.error(`Error processing lead ${lead.id}:`, e);
        // Revert claim on error
        await supabase.from("leads").update({ email_follow_up_2_sent: false }).eq("id", lead.id);
        await logFollowUpSend(supabase, lead.id, lead.salon_name, lead.email, lead.email_from, followUp2Template.name || "Follow-up 2", "followup_2", "failed", e.message);
        results.failed++;
      }
    }

    console.log("Auto follow-up results:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in process-auto-followups:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
