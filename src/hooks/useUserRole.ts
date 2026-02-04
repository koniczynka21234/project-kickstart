import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'szef' | 'pracownik';

// Global cache to persist role across component unmounts/remounts
const roleCache = new Map<string, AppRole>();

interface UserRole {
  role: AppRole | null;
  isSzef: boolean;
  loading: boolean;
}

export function useUserRole(): UserRole {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(() => {
    // Initialize from cache if available
    if (user?.id) {
      return roleCache.get(user.id) ?? null;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    // If we have cached role, don't show as loading
    if (user?.id && roleCache.has(user.id)) {
      return false;
    }
    return true;
  });
  const fetchedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading first
    if (authLoading) {
      return;
    }

    if (!user) {
      setRole(null);
      setLoading(false);
      fetchedUserIdRef.current = null;
      return;
    }

    // Check cache first
    const cachedRole = roleCache.get(user.id);
    if (cachedRole) {
      setRole(cachedRole);
      setLoading(false);
    }

    // Prevent duplicate fetches for same user
    if (fetchedUserIdRef.current === user.id) {
      return;
    }

    const fetchRole = async () => {
      try {
        fetchedUserIdRef.current = user.id;
        
        // Only show loading if we don't have cached data
        if (!roleCache.has(user.id)) {
          setLoading(true);
        }
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
          roleCache.delete(user.id);
        } else {
          const fetchedRole = data?.role as AppRole || null;
          setRole(fetchedRole);
          if (fetchedRole) {
            roleCache.set(user.id, fetchedRole);
          }
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();

    // Subscribe to role changes
    const channel = supabase
      .channel(`user-role-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchedUserIdRef.current = null;
          fetchRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, authLoading]);

  // Memoize to prevent unnecessary re-renders
  return useMemo(() => ({
    role,
    isSzef: role === 'szef',
    loading: authLoading || loading
  }), [role, authLoading, loading]);
}
