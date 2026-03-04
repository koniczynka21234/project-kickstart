import { supabase } from '@/integrations/supabase/client';

interface DuplicateCheckParams {
  table: 'leads' | 'clients';
  salon_name: string;
  phone?: string | null;
  email?: string | null;
  excludeId?: string; // exclude current record when editing
}

interface DuplicateResult {
  isDuplicate: boolean;
  matchedRecord?: {
    id: string;
    salon_name: string;
    phone?: string | null;
    email?: string | null;
  };
  matchReason?: string;
}

export async function checkDuplicate({
  table,
  salon_name,
  phone,
  email,
  excludeId,
}: DuplicateCheckParams): Promise<DuplicateResult> {
  const trimmedName = salon_name.trim().toLowerCase();
  const trimmedPhone = phone?.replace(/[\s\-\(\)]/g, '') || null;
  const trimmedEmail = email?.trim().toLowerCase() || null;

  if (!trimmedName) return { isDuplicate: false };

  // Build query - fetch potential matches by salon_name
  let query = supabase
    .from(table)
    .select('id, salon_name, phone, email')
    .ilike('salon_name', trimmedName);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data: nameMatches } = await query.limit(10);

  if (nameMatches && nameMatches.length > 0) {
    for (const match of nameMatches) {
      const matchPhone = match.phone?.replace(/[\s\-\(\)]/g, '') || null;
      const matchEmail = match.email?.trim().toLowerCase() || null;

      // Same name + same phone = duplicate
      if (trimmedPhone && matchPhone && trimmedPhone === matchPhone) {
        return {
          isDuplicate: true,
          matchedRecord: match,
          matchReason: `Istnieje już ${table === 'leads' ? 'lead' : 'klient'} "${match.salon_name}" z tym samym numerem telefonu`,
        };
      }

      // Same name + same email = duplicate
      if (trimmedEmail && matchEmail && trimmedEmail === matchEmail) {
        return {
          isDuplicate: true,
          matchedRecord: match,
          matchReason: `Istnieje już ${table === 'leads' ? 'lead' : 'klient'} "${match.salon_name}" z tym samym adresem email`,
        };
      }

      // Same name + no phone/email on either side (both empty) = likely duplicate
      if (!trimmedPhone && !matchPhone && !trimmedEmail && !matchEmail) {
        return {
          isDuplicate: true,
          matchedRecord: match,
          matchReason: `Istnieje już ${table === 'leads' ? 'lead' : 'klient'} o nazwie "${match.salon_name}" — dodaj telefon lub email żeby rozróżnić`,
        };
      }
    }
  }

  // Also check by phone across all records (different name, same phone)
  if (trimmedPhone) {
    let phoneQuery = supabase
      .from(table)
      .select('id, salon_name, phone, email')
      .eq('phone', phone!.trim());

    if (excludeId) {
      phoneQuery = phoneQuery.neq('id', excludeId);
    }

    const { data: phoneMatches } = await phoneQuery.limit(5);
    if (phoneMatches && phoneMatches.length > 0) {
      return {
        isDuplicate: true,
        matchedRecord: phoneMatches[0],
        matchReason: `Ten numer telefonu jest już przypisany do "${phoneMatches[0].salon_name}"`,
      };
    }
  }

  return { isDuplicate: false };
}

// Cross-table check: lead vs clients
export async function checkLeadExistsAsClient(
  salon_name: string,
  phone?: string | null,
  email?: string | null,
): Promise<DuplicateResult> {
  return checkDuplicate({
    table: 'clients',
    salon_name,
    phone,
    email,
  });
}
