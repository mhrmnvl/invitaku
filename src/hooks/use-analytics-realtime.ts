import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  getAnalyticsStats,
  getEventAnalytics,
  type AnalyticsSnapshot,
  type AnalyticsStats,
  type RecentActivity,
} from "@/lib/analytics-api";

interface UseAnalyticsRealtimeReturn {
  data: AnalyticsSnapshot;
  isLive: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  secondsAgo: number;
}

export function useAnalyticsRealtime(
  eventId: string,
  initialData: AnalyticsSnapshot,
): UseAnalyticsRealtimeReturn {
  const [data, setData] = useState<AnalyticsSnapshot>(initialData);
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    initialData.lastUpdated ? new Date(initialData.lastUpdated) : null,
  );
  const [secondsAgo, setSecondsAgo] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lightweight stats refresh (called on realtime change events)
  const refreshStats = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsRefreshing(true);
      try {
        const stats = await getAnalyticsStats({ data: { eventId } });
        setData((prev) => ({
          ...prev,
          stats: stats as AnalyticsStats,
          lastUpdated: new Date().toISOString(),
        }));
        setLastUpdated(new Date());
        setSecondsAgo(0);
      } catch (e) {
        console.error("[analytics-realtime] stats refresh failed:", e);
      } finally {
        setIsRefreshing(false);
      }
    }, 400); // 400ms debounce to batch multiple rapid changes
  }, [eventId]);

  // Activity prepend (called on guest_activities INSERT)
  const prependActivity = useCallback((activity: RecentActivity) => {
    setData((prev) => ({
      ...prev,
      recentActivities: [activity, ...prev.recentActivities].slice(0, 20),
    }));
  }, []);

  // Full refresh (for RSVP timeline — called less frequently)
  const fullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const snapshot = await getEventAnalytics({ data: { eventId } });
      setData(snapshot as AnalyticsSnapshot);
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (e) {
      console.error("[analytics-realtime] full refresh failed:", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [eventId]);

  // Realtime subscription
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`analytics:${eventId}`)
      // RSVP changes → refresh stats + timeline
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_rsvps" }, () => {
        refreshStats();
        // Full refresh for timeline after short delay
        setTimeout(fullRefresh, 1500);
      })
      // Guest changes → refresh stats (guest count)
      .on("postgres_changes", { event: "*", schema: "public", table: "guests" }, () =>
        refreshStats(),
      )
      // Invitation changes → refresh stats (views, sent count)
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_invitations" }, () =>
        refreshStats(),
      )
      // New activity → prepend to feed
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guest_activities" },
        (payload) => {
          const row = payload.new as any;
          prependActivity({
            id: row.id,
            guestName: "Tamu", // Guest name requires a join; show generic and let next full refresh fix it
            actor: row.actor ?? "system",
            description: row.description ?? "",
            timestamp: row.timestamp ?? new Date().toISOString(),
          });
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setIsLive(false);
    };
  }, [eventId, refreshStats, prependActivity, fullRefresh]);

  // "Seconds ago" ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastUpdated) return;
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 5000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return { data, isLive, isRefreshing, lastUpdated, secondsAgo };
}
