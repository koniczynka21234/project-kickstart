import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes
const UPDATE_INTERVAL = 60 * 1000; // 60 seconds - reduced frequency
const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes - consider offline after this

export function useActivityStatus() {
  const { user } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const lastUpdateRef = useRef(0);
  const currentStatusRef = useRef<string>("offline");
  const mountedRef = useRef(false);

  // Update status in database with throttling
  const updateStatus = useCallback(async (status: string, force = false) => {
    if (!user?.id) return;
    
    const now = Date.now();
    // Throttle updates to once per 10 seconds unless forced
    if (!force && now - lastUpdateRef.current < 10000) return;
    // Skip if same status
    if (!force && currentStatusRef.current === status) return;
    
    lastUpdateRef.current = now;
    
    try {
      await supabase
        .from("profiles")
        .update({ 
          status, 
          last_seen_at: new Date().toISOString() 
        })
        .eq("id", user.id);
      
      currentStatusRef.current = status;
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || mountedRef.current) return;
    mountedRef.current = true;

    // Set online immediately
    updateStatus("online", true);
    lastActivityRef.current = Date.now();

    // Activity handler - just record activity, don't update DB every time
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      // If we were away/offline, immediately go online
      if (currentStatusRef.current !== "online") {
        updateStatus("online", true);
      }
    };

    // Minimal event listeners
    const events = ["mousedown", "keydown", "touchstart"];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodic status check
    const checkInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceActivity >= IDLE_TIMEOUT && currentStatusRef.current === "online") {
        updateStatus("away");
      } else if (timeSinceActivity < IDLE_TIMEOUT && currentStatusRef.current !== "online") {
        updateStatus("online");
      }
    }, UPDATE_INTERVAL);

    // Tab visibility
    const handleVisibility = () => {
      if (document.hidden) {
        updateStatus("away");
      } else {
        lastActivityRef.current = Date.now();
        updateStatus("online", true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Page unload - set offline
    const handleUnload = () => {
      if (!user?.id) return;
      
      const data = JSON.stringify({ 
        status: "offline", 
        last_seen_at: new Date().toISOString() 
      });
      
      // Use sendBeacon for reliable delivery
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
        new Blob([data], { type: 'application/json' })
      );
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      mountedRef.current = false;
      events.forEach(event => window.removeEventListener(event, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      clearInterval(checkInterval);
    };
  }, [user?.id, updateStatus]);

  return { currentStatus: currentStatusRef.current };
}

// Helper to check if a user is actually online based on last_seen_at
export function isUserOnline(lastSeenAt: string | null, status: string | null): 'online' | 'away' | 'offline' {
  if (!lastSeenAt) return 'offline';
  
  const lastSeen = new Date(lastSeenAt).getTime();
  const now = Date.now();
  const diff = now - lastSeen;
  
  // If last seen more than 5 minutes ago, they're offline regardless of status
  if (diff > OFFLINE_THRESHOLD) return 'offline';
  
  // If last seen more than 3 minutes ago, they're away
  if (diff > IDLE_TIMEOUT) return 'away';
  
  // Otherwise trust the stored status
  return (status as 'online' | 'away' | 'offline') || 'offline';
}
