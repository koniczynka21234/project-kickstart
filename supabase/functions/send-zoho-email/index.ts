import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  leadId: string;
  to: string;
  subject: string;
  body: string;
  fromEmail: "kontakt" | "biuro";
  followUpType?: "cold_email" | "email_follow_up_1" | "email_follow_up_2";
}

// Get Zoho credentials from database
async function getZohoCredentialsFromDB(supabase: any, emailFrom: string): Promise<{ clientId: string; clientSecret: string; refreshToken: string } | null> {
  const { data, error } = await supabase
    .from("zoho_credentials")
    .select("*")
    .eq("email_account", emailFrom)
    .single();

  if (error || !data) {
    console.error(`No credentials found for ${emailFrom}:`, error?.message);
    return null;
  }

  return {
    clientId: data.client_id,
    clientSecret: data.client_secret,
    refreshToken: data.refresh_token,
  };
}

async function getZohoAccessToken(supabase: any, emailFrom: string): Promise<string> {
  const credentials = await getZohoCredentialsFromDB(supabase, emailFrom);
  if (!credentials) {
    throw new Error(`Brak credentials dla ${emailFrom} w tabeli zoho_credentials`);
  }

  console.log(`Getting Zoho token for ${emailFrom}`);

  const response = await fetch("https://accounts.zoho.eu/oauth/v2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
    }),
  });

  const responseText = await response.text();
  console.log(`Zoho token response: status=${response.status}, body=${responseText}`);

  if (!response.ok) {
    console.error(`Zoho token error for ${emailFrom}:`, responseText);
    throw new Error(`Błąd tokena Zoho: ${response.status} - ${responseText.substring(0, 100)}`);
  }

  const data = JSON.parse(responseText);
  
  if (!data.access_token) {
    console.error(`No access_token in response for ${emailFrom}:`, data);
    throw new Error("Brak access_token w odpowiedzi Zoho");
  }

  console.log(`Successfully got access token for ${emailFrom}`);
  return data.access_token;
}

async function sendEmailViaZoho(
  accessToken: string,
  fromEmail: string,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get account ID first
    const accountsResponse = await fetch("https://mail.zoho.eu/api/accounts", {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
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

    // Send email with sender name "Aurine"
    const sendResponse = await fetch(`https://mail.zoho.eu/api/accounts/${account.accountId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fromAddress: `"Aurine" <${fromEmail}>`,
        toAddress: to,
        subject: subject,
        content: body,
        mailFormat: "html",
      }),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("Zoho send error:", errorText);
      return { success: false, error: `Błąd wysyłki: ${sendResponse.status} - ${errorText.substring(0, 100)}` };
    }

    console.log(`Email sent successfully from Aurine <${fromEmail}> to ${to}`);
    return { success: true };
  } catch (e: any) {
    console.error("Send email error:", e);
    return { success: false, error: `Wyjątek: ${e.message}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Use service role key to access zoho_credentials table
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // User client for auth and lead updates
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { leadId, to, subject, body, fromEmail, followUpType }: SendEmailRequest = await req.json();

    if (!leadId || !to || !subject || !body || !fromEmail) {
      throw new Error("Missing required fields");
    }

    const senderEmail = fromEmail === "kontakt" ? "kontakt@aurine.pl" : "biuro@aurine.pl";

    // Get Zoho access token using credentials from database
    const accessToken = await getZohoAccessToken(supabaseAdmin, senderEmail);
    
    const sendResult = await sendEmailViaZoho(accessToken, senderEmail, to, subject, body);
    
    if (!sendResult.success) {
      throw new Error(sendResult.error || "Błąd wysyłki email");
    }

    // Update lead in database
    const updateData: Record<string, any> = {
      email_from: senderEmail,
      last_contact_date: new Date().toISOString().split('T')[0],
    };

    if (followUpType === "cold_email") {
      updateData.cold_email_sent = true;
      updateData.cold_email_date = new Date().toISOString().split('T')[0];
      // Set follow-up dates: 3 days and 7 days after cold email
      const followUp1Date = new Date();
      followUp1Date.setDate(followUp1Date.getDate() + 3);
      updateData.email_follow_up_1_date = followUp1Date.toISOString().split('T')[0];
      
      const followUp2Date = new Date();
      followUp2Date.setDate(followUp2Date.getDate() + 7);
      updateData.email_follow_up_2_date = followUp2Date.toISOString().split('T')[0];
    } else if (followUpType === "email_follow_up_1") {
      updateData.email_follow_up_1_sent = true;
      updateData.email_follow_up_1_date = new Date().toISOString().split('T')[0];
    } else if (followUpType === "email_follow_up_2") {
      updateData.email_follow_up_2_sent = true;
      updateData.email_follow_up_2_date = new Date().toISOString().split('T')[0];
    }

    const { error: updateError } = await supabaseUser
      .from("leads")
      .update(updateData)
      .eq("id", leadId);

    if (updateError) {
      console.error("Failed to update lead:", updateError);
    }

    // Create interaction record
    await supabaseUser.from("lead_interactions").insert({
      lead_id: leadId,
      type: followUpType || "email",
      title: `Email wysłany: ${subject}`,
      content: `Email wysłany z Aurine <${senderEmail}> do ${to}`,
      created_by: user.id,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-zoho-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
