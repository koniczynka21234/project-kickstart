import { supabase } from "@/integrations/supabase/client";
import { ScriptStatus } from "@/hooks/useConversationScriptsDB";

const db = supabase as any;

const getDefaultStatus = (sentDate?: string | null): ScriptStatus => {
  if (!sentDate) return "zrealizowany";
  let d: Date | null = null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sentDate);
  if (m) {
    d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  } else {
    const dt = new Date(sentDate);
    d = isNaN(dt.getTime()) ? null : dt;
  }
  if (!d) return "zrealizowany";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "dzisiaj";
  if (d.getTime() > now.getTime()) return "przyszly";
  return "zrealizowany";
};

const normalizeSentDate = (sentDate?: string | null): string | null => {
  if (!sentDate) return null;
  const m1 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sentDate);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  const m2 = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(sentDate);
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  const m3 = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(sentDate);
  if (m3) return `${m3[3]}-${m3[2]}-${m3[1]}`;
  const dt = new Date(sentDate);
  if (isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
};

export const createConversationScriptForAudit = async (params: {
  auditId: string;
  salonName: string;
  sentDate?: string | null;
  guardianId?: string | null;
  guardianName?: string | null;
  leadId?: string | null;
}) => {
  if (!params.auditId) return null;
  const { data: authData } = await supabase.auth.getUser();
  const createdBy = authData?.user?.id || null;
  const existing = await db
    .from("conversation_scripts")
    .select("id, guardian_id, guardian_name")
    .eq("audit_id", params.auditId)
    .maybeSingle();
  if (existing.data?.id) {
    const isoDate = normalizeSentDate(params.sentDate || null);
    let guardianId: string | null = null;
    let guardianName: string | null = null;
    try {
      const docRes = await supabase
        .from("documents")
        .select("created_by")
        .eq("id", params.auditId)
        .maybeSingle();
      guardianId = (docRes.data as any)?.created_by || createdBy || null;
      if (guardianId) {
        const prof = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", guardianId)
          .maybeSingle();
        guardianName = (prof.data as any)?.full_name || null;
      }
    } catch {}
    const needsUpdate = (!existing.data.guardian_id && guardianId) || (!existing.data.guardian_name && guardianName);
    if (needsUpdate) {
      const upd = await db
        .from("conversation_scripts")
        .update({ guardian_id: guardianId, guardian_name: guardianName, sent_date: isoDate })
        .eq("id", existing.data.id);
      if (upd.error) {
        const fallback = await db
          .from("conversation_scripts")
          .update({ sent_date: isoDate })
          .eq("id", existing.data.id);
        if (fallback.error) {
          console.error("conversation_scripts update error", fallback.error);
        }
      }
    }
    return existing.data.id as string;
  }
  const isoDate = normalizeSentDate(params.sentDate || null);
  const status = getDefaultStatus(isoDate);
  let guardianId: string | null = null;
  let guardianName: string | null = null;

  try {
    const docRes = await supabase
      .from("documents")
      .select("created_by")
      .eq("id", params.auditId)
      .maybeSingle();
    guardianId = (docRes.data as any)?.created_by || createdBy || null;
  } catch {}
  if (!guardianName && guardianId) {
    try {
      const prof = await supabase.from('profiles').select('full_name').eq('id', guardianId).maybeSingle();
      guardianName = (prof.data as any)?.full_name || guardianName;
    } catch {}
  }
  let { data, error } = await db
    .from("conversation_scripts")
    .upsert({
      audit_id: params.auditId,
      salon_name: params.salonName,
      sent_date: isoDate,
      status,
      created_by: createdBy,
      guardian_id: guardianId,
      guardian_name: guardianName,
    }, { onConflict: "audit_id" })
    .select("id")
    .maybeSingle();
  if (error) {
    const fb = await db
      .from("conversation_scripts")
      .upsert({
        audit_id: params.auditId,
        salon_name: params.salonName,
        sent_date: isoDate,
        status,
        created_by: createdBy,
      }, { onConflict: "audit_id" })
      .select("id")
      .maybeSingle();
    data = fb.data;
    error = fb.error;
  }
  if (error || !data?.id) {
    console.error("conversation_scripts insert error", error);
    return null;
  }
  return data.id as string;
};

export const markConversationOutcome = async (id: string, payload: {
  status: ScriptStatus;
  notes?: string | null;
  conversation_date?: string | null;
  conductor_id?: string | null;
  conductor_name?: string | null;
  outcome?: string | null;
}): Promise<{ success: boolean; error?: any }> => {
  const convDate = normalizeSentDate(payload.conversation_date || null);
  const updateBody: any = {
    status: payload.status,
    notes: payload.notes ?? null,
    conversation_date: convDate ?? null,
    conductor_id: payload.conductor_id ?? null,
    conductor_name: payload.conductor_name ?? null,
    outcome: payload.outcome ?? null,
  };
  let { data, error } = await db
    .from("conversation_scripts")
    .update(updateBody)
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !data?.id) {
    const fb = await db
      .from("conversation_scripts")
      .update({ status: payload.status })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (fb.error || !fb.data?.id) {
      return { success: false, error: fb.error || "No rows updated" };
    }
    return { success: true };
  }
  return { success: true };
};
