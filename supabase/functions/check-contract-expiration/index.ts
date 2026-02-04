import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking contract expirations and payment dues for date: ${today}`);

    // Get all team members (users with roles) to send notifications to everyone
    const { data: teamMembers, error: teamError } = await supabase
      .from('user_roles')
      .select('user_id');

    if (teamError) {
      console.error('Error fetching team members:', teamError);
      throw teamError;
    }

    const teamUserIds = [...new Set((teamMembers || []).map(m => m.user_id))];
    console.log(`Found ${teamUserIds.length} team members to notify`);

    // Helper function to create notifications for all team members
    const createNotificationForTeam = async (payload: {
      title: string;
      content?: string | null;
      type: string;
      reference_type?: string | null;
      reference_id?: string | null;
    }) => {
      const notifications = teamUserIds.map(userId => ({
        user_id: userId,
        ...payload,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) {
        console.error("Failed to insert notifications", { error, payload });
        return false;
      }
      console.log("Inserted notifications for team", {
        type: payload.type,
        reference_id: payload.reference_id,
        users_count: teamUserIds.length,
      });
      return true;
    };

    // Helper to check if notification already exists for any team member today
    const notificationExistsToday = async (referenceId: string, type: string): Promise<boolean> => {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('reference_id', referenceId)
        .eq('type', type)
        .gte('created_at', today)
        .limit(1);
      return (data?.length || 0) > 0;
    };

    // Get all active/paused clients with contract info
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, salon_name, status, contract_start_date, contract_end_date, contract_duration_months, assigned_to')
      .in('status', ['active', 'paused'])
      .not('contract_start_date', 'is', null);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      throw clientsError;
    }

    console.log(`Found ${clients?.length || 0} clients with contracts to check`);

    const expiredClients: string[] = [];
    const expiringSoonClients: { id: string; salon_name: string; days_remaining: number }[] = [];

    for (const client of clients || []) {
      const startDate = new Date(client.contract_start_date);
      const endDate = client.contract_end_date 
        ? new Date(client.contract_end_date)
        : new Date(startDate.getTime() + (client.contract_duration_months || 1) * 30 * 24 * 60 * 60 * 1000);
      
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Check if contract is expired
      if (daysRemaining < 0) {
        expiredClients.push(client.id);
        console.log(`Contract expired for client: ${client.salon_name} (${Math.abs(daysRemaining)} days ago)`);
        
        // Create notification for whole team about expired contract
        const exists = await notificationExistsToday(client.id, 'contract_expired');
        if (!exists) {
          await createNotificationForTeam({
            title: 'Umowa wygasła',
            content: `Umowa z klientem "${client.salon_name}" wygasła. Skontaktuj się w sprawie przedłużenia.`,
            type: 'contract_expired',
            reference_type: 'client',
            reference_id: client.id,
          });
        }
      }
      // Check if contract expires TODAY (last day!)
      else if (daysRemaining === 0) {
        expiringSoonClients.push({
          id: client.id,
          salon_name: client.salon_name,
          days_remaining: 0,
        });
        console.log(`Contract expires TODAY for client: ${client.salon_name}`);
        
        const exists = await notificationExistsToday(client.id, 'contract_expiring');
        if (!exists) {
          await createNotificationForTeam({
            title: 'Umowa wygasa DZIŚ!',
            content: `Umowa z klientem "${client.salon_name}" wygasa dzisiaj! Pilnie skontaktuj się w sprawie przedłużenia.`,
            type: 'contract_expiring',
            reference_type: 'client',
            reference_id: client.id,
          });
        }
      }
      // Check if contract expires in 3 days (create notification once at 3 days)
      else if (daysRemaining === 3) {
        expiringSoonClients.push({
          id: client.id,
          salon_name: client.salon_name,
          days_remaining: daysRemaining,
        });
        console.log(`Contract expiring in 3 days for client: ${client.salon_name}`);
        
        const exists = await notificationExistsToday(client.id, 'contract_expiring');
        if (!exists) {
          await createNotificationForTeam({
            title: 'Umowa wygasa za 3 dni',
            content: `Umowa z klientem "${client.salon_name}" wygasa za 3 dni. Rozważ przedłużenie współpracy.`,
            type: 'contract_expiring',
            reference_type: 'client',
            reference_id: client.id,
          });
        }
      }
      // Track clients expiring within 3 days (for reporting only)
      else if (daysRemaining <= 3 && daysRemaining > 0) {
        expiringSoonClients.push({
          id: client.id,
          salon_name: client.salon_name,
          days_remaining: daysRemaining,
        });
        console.log(`Contract expiring soon for client: ${client.salon_name} (${daysRemaining} days remaining)`);
      }
    }

    // Update expired clients to 'churned' status
    if (expiredClients.length > 0) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ status: 'churned' })
        .in('id', expiredClients);

      if (updateError) {
        console.error('Error updating client statuses:', updateError);
        throw updateError;
      }
      console.log(`Updated ${expiredClients.length} clients to 'churned' status`);
    }

    // ===== CHECK PAYMENT DUE DATES =====
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysFromNowStr = threeDaysFromNow.toISOString().split('T')[0];

    // Get pending payments due in 3 days
    const { data: upcomingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id, 
        amount, 
        due_date, 
        client_id,
        document_id,
        clients(salon_name)
      `)
      .eq('status', 'pending')
      .eq('due_date', threeDaysFromNowStr);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    } else {
      console.log(`Found ${upcomingPayments?.length || 0} payments due in 3 days`);
      
      for (const payment of upcomingPayments || []) {
        const clientData = payment.clients as unknown;
        const client = Array.isArray(clientData) ? clientData[0] : clientData as { salon_name: string } | null;
        if (client) {
          const exists = await notificationExistsToday(payment.id, 'payment_due');
          if (!exists) {
            await createNotificationForTeam({
              title: 'Termin płatności za 3 dni',
              content: `Faktura dla "${client.salon_name}" (${payment.amount} PLN) ma termin płatności za 3 dni.`,
              type: 'payment_due',
              reference_type: 'payment',
              reference_id: payment.id,
            });
            console.log(`Notification sent for payment ${payment.id}`);
          }
        }
      }
    }

    // ===== CHECK PENDING FINAL INVOICES =====
    // Check for invoices due in 3 days
    const { data: pendingInvoices3d, error: pending3dError } = await supabase
      .from('pending_final_invoices')
      .select(`
        id,
        remaining_amount,
        expected_date,
        client_id,
        clients(salon_name)
      `)
      .eq('status', 'pending')
      .eq('expected_date', threeDaysFromNowStr);

    if (pending3dError) {
      console.error('Error fetching pending invoices (3 days):', pending3dError);
    } else {
      console.log(`Found ${pendingInvoices3d?.length || 0} pending final invoices due in 3 days`);
      
      for (const invoice of pendingInvoices3d || []) {
        const clientData = invoice.clients as unknown;
        const client = Array.isArray(clientData) ? clientData[0] : clientData as { salon_name: string } | null;
        if (client) {
          const exists = await notificationExistsToday(invoice.id, 'final_invoice_due');
          if (!exists) {
            await createNotificationForTeam({
              title: 'Faktura końcowa za 3 dni',
              content: `Faktura końcowa dla "${client.salon_name}" (${invoice.remaining_amount} PLN) powinna zostać wystawiona za 3 dni.`,
              type: 'final_invoice_due',
              reference_type: 'client',
              reference_id: invoice.client_id,
            });
            console.log(`Notification sent for pending invoice ${invoice.id} (3 days)`);
          }
        }
      }
    }

    // Check for invoices due TODAY
    const { data: pendingInvoicesToday, error: pendingTodayError } = await supabase
      .from('pending_final_invoices')
      .select(`
        id,
        remaining_amount,
        expected_date,
        client_id,
        clients(salon_name)
      `)
      .eq('status', 'pending')
      .eq('expected_date', today);

    if (pendingTodayError) {
      console.error('Error fetching pending invoices (today):', pendingTodayError);
    } else {
      console.log(`Found ${pendingInvoicesToday?.length || 0} pending final invoices due today`);
      
      for (const invoice of pendingInvoicesToday || []) {
        const clientData = invoice.clients as unknown;
        const client = Array.isArray(clientData) ? clientData[0] : clientData as { salon_name: string } | null;
        if (client) {
          const exists = await notificationExistsToday(invoice.id, 'final_invoice_due');
          if (!exists) {
            await createNotificationForTeam({
              title: 'Faktura końcowa - termin DZIŚ!',
              content: `Faktura końcowa dla "${client.salon_name}" (${invoice.remaining_amount} PLN) powinna zostać wystawiona DZISIAJ!`,
              type: 'final_invoice_due',
              reference_type: 'client',
              reference_id: invoice.client_id,
            });
            console.log(`Notification sent for pending invoice ${invoice.id} (today)`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredClients.length,
        expiring_soon_count: expiringSoonClients.length,
        payments_notified: upcomingPayments?.length || 0,
        pending_invoices_3d: pendingInvoices3d?.length || 0,
        pending_invoices_today: pendingInvoicesToday?.length || 0,
        team_members: teamUserIds.length,
        message: `Processed ${clients?.length || 0} clients. Updated ${expiredClients.length} to churned, ${expiringSoonClients.length} expiring soon.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-contract-expiration:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
