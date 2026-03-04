import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  id: string;
  name: string;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name');
    setTeamMembers((data || []).map(p => ({ id: p.id, name: p.full_name || 'Nieznany' })));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  return { teamMembers, loading, refetch: fetchTeamMembers };
};
