import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, requireUserSession } from "./auth-server";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnalyticsStats {
  totalGuests: number;
  totalInvitationsSent: number;
  totalViews: number;
  rsvpCount: number;
  attendingCount: number;
  decliningCount: number;
  pendingCount: number;
  conversionRate: number;
}

export interface RsvpTimelinePoint {
  date: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  guestName: string;
  actor: string;
  description: string;
  timestamp: string;
}

export interface AnalyticsSnapshot {
  stats: AnalyticsStats;
  rsvpTimeline: RsvpTimelinePoint[];
  recentActivities: RecentActivity[];
  lastUpdated: string;
}

// ─── Server Functions ─────────────────────────────────────────────────────────

export const getEventAnalytics = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();
    const { eventId } = data;

    // Verify event ownership
    const { data: eventCheck, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();

    if (eventErr || !eventCheck) {
      throw new Error("Akses ditolak atau acara tidak ditemukan.");
    }

    const { count: totalGuests } = await supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .is("deleted_at", null);

    const { data: rsvpRows } = await supabase
      .from("guest_rsvps")
      .select("guest_id, status, responded_at, guests!inner(event_id)")
      .eq("guests.event_id", eventId);

    const rsvpCount = rsvpRows?.length ?? 0;
    const attendingCount = rsvpRows?.filter((r) => r.status === "Attending").length ?? 0;
    const decliningCount = rsvpRows?.filter((r) => r.status === "Declined").length ?? 0;
    const pendingCount = rsvpRows?.filter((r) => r.status === "Pending").length ?? 0;

    const { data: invitationRows } = await supabase
      .from("guest_invitations")
      .select("view_count, delivery_status, guests!inner(event_id)")
      .eq("guests.event_id", eventId);

    const totalViews =
      invitationRows?.reduce((sum: number, i: any) => sum + (i.view_count ?? 0), 0) ?? 0;
    const totalInvitationsSent =
      invitationRows?.filter((i: any) => ["Sent", "Viewed"].includes(i.delivery_status)).length ??
      0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timelineMap: Record<string, number> = {};
    rsvpRows
      ?.filter((r: any) => r.responded_at && new Date(r.responded_at) >= thirtyDaysAgo)
      .forEach((r: any) => {
        const day = r.responded_at!.slice(0, 10);
        timelineMap[day] = (timelineMap[day] ?? 0) + 1;
      });

    const rsvpTimeline: RsvpTimelinePoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      rsvpTimeline.push({ date: key, count: timelineMap[key] ?? 0 });
    }

    const { data: activityRows } = await supabase
      .from("guest_activities")
      .select("id, timestamp, actor, description, guest_id, guests!inner(event_id, name)")
      .eq("guests.event_id", eventId)
      .order("timestamp", { ascending: false })
      .limit(20);

    const recentActivities: RecentActivity[] = (activityRows ?? []).map((a: any) => ({
      id: a.id,
      guestName: a.guests?.name ?? "Tamu",
      actor: a.actor,
      description: a.description,
      timestamp: a.timestamp ?? "",
    }));

    const guests = totalGuests ?? 0;

    return {
      stats: {
        totalGuests: guests,
        totalInvitationsSent,
        totalViews,
        rsvpCount,
        attendingCount,
        decliningCount,
        pendingCount,
        conversionRate: guests > 0 ? Math.round((rsvpCount / guests) * 100) : 0,
      },
      rsvpTimeline,
      recentActivities,
      lastUpdated: new Date().toISOString(),
    } satisfies AnalyticsSnapshot;
  });

export const getAnalyticsStats = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();
    const { eventId } = data;

    // Verify event ownership
    const { data: eventCheck, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("created_by", user.id)
      .single();

    if (eventErr || !eventCheck) {
      throw new Error("Akses ditolak atau acara tidak ditemukan.");
    }

    const { count: totalGuests } = await supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .is("deleted_at", null);

    const { data: rsvpRows } = await supabase
      .from("guest_rsvps")
      .select("status, guests!inner(event_id)")
      .eq("guests.event_id", eventId);

    const { data: invitationRows } = await supabase
      .from("guest_invitations")
      .select("view_count, delivery_status, guests!inner(event_id)")
      .eq("guests.event_id", eventId);

    const rsvpCount = rsvpRows?.length ?? 0;
    const attendingCount = rsvpRows?.filter((r: any) => r.status === "Attending").length ?? 0;
    const decliningCount = rsvpRows?.filter((r: any) => r.status === "Declined").length ?? 0;
    const pendingCount = rsvpRows?.filter((r: any) => r.status === "Pending").length ?? 0;
    const totalViews =
      invitationRows?.reduce((sum: number, i: any) => sum + (i.view_count ?? 0), 0) ?? 0;
    const totalInvitationsSent =
      invitationRows?.filter((i: any) => ["Sent", "Viewed"].includes(i.delivery_status)).length ??
      0;
    const guests = totalGuests ?? 0;

    return {
      totalGuests: guests,
      totalInvitationsSent,
      totalViews,
      rsvpCount,
      attendingCount,
      decliningCount,
      pendingCount,
      conversionRate: guests > 0 ? Math.round((rsvpCount / guests) * 100) : 0,
    } satisfies AnalyticsStats;
  });

export const getDashboardOverviewData = createServerFn({ method: "GET" })
  .validator((data: any) => data)
  .handler(async () => {
    const user = await requireUserSession();
    const supabase = getSupabaseServerClient();

    // 1. Get all events
    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("*, event_settings(*), event_statistics(*)")
      .eq("created_by", user.id)
      .is("deleted_at", null);

    if (eventsErr) {
      throw new Error(`Gagal memuat data dashboard: ${eventsErr.message}`);
    }

    // 2. Aggregate stats
    const totalEvents = events?.length || 0;
    const activeEvents = events?.filter((e) => e.status === "Published").length || 0;
    const draftEvents = events?.filter((e) => e.status === "Draft").length || 0;

    let totalGuests = 0;
    let totalViews = 0;
    let rsvpCount = 0;
    let attendingCount = 0;

    events?.forEach((e) => {
      const stats = e.event_statistics?.[0];
      if (stats) {
        totalGuests += stats.guest_count || 0;
        totalViews += stats.views || 0;
        rsvpCount += stats.rsvp_count || 0;
        attendingCount += stats.attendance_count || 0;
      }
    });

    // 3. Get recent activities across all user events
    const eventIds = events?.map((e) => e.id) || [];
    let recentActivities: any[] = [];

    if (eventIds.length > 0) {
      const { data: activities, error: actErr } = await supabase
        .from("guest_activities")
        .select("*, guests!inner(name, event_id, events!inner(name))")
        .in("guests.event_id", eventIds)
        .order("timestamp", { ascending: false })
        .limit(5);

      if (!actErr && activities) {
        recentActivities = activities.map((a: any) => ({
          id: a.id,
          guest: a.guests?.name || "Tamu",
          action: a.actor === "Guest" ? "RSVP" : "Diperbarui",
          details: a.description,
          event: a.guests?.events?.name || "Acara",
          time: formatDistanceToNow(new Date(a.timestamp), { locale: localeId, addSuffix: true }),
        }));
      }
    }

    // 4. Compute tasks dynamically
    const tasks = [];
    if (totalEvents === 0) {
      tasks.push({
        id: "t1",
        text: "Buat acara undangan pertama Anda di Dasbor",
        checked: false,
        urgency: "high",
      });
    } else {
      tasks.push({
        id: "t1",
        text: "Buat acara undangan pertama Anda di Dasbor",
        checked: true,
      });

      const firstEvent = events[0];
      const statsObj = firstEvent.event_statistics?.[0];
      const settingsObj = firstEvent.event_settings?.[0];

      // Check guest list
      if (!statsObj || (statsObj.guest_count || 0) === 0) {
        tasks.push({
          id: "t2",
          text: `Tambahkan daftar tamu pertama Anda untuk acara "${firstEvent.name}"`,
          checked: false,
          urgency: "medium",
        });
      } else {
        tasks.push({
          id: "t2",
          text: `Tambahkan daftar tamu pertama Anda untuk acara "${firstEvent.name}"`,
          checked: true,
        });
      }

      // Check gift config
      const hasGifts =
        settingsObj?.gift_methods &&
        Array.isArray(settingsObj.gift_methods) &&
        settingsObj.gift_methods.length > 0;
      if (!hasGifts) {
        tasks.push({
          id: "t3",
          text: `Lengkapi informasi hadiah / nomor rekening untuk acara "${firstEvent.name}"`,
          checked: false,
          urgency: "medium",
        });
      } else {
        tasks.push({
          id: "t3",
          text: `Lengkapi informasi hadiah / nomor rekening untuk acara "${firstEvent.name}"`,
          checked: true,
        });
      }

      // Check published status
      if (firstEvent.status === "Draft") {
        tasks.push({
          id: "t4",
          text: `Publikasikan undangan acara "${firstEvent.name}" agar bisa diakses tamu`,
          checked: false,
          urgency: "high",
        });
      }
    }

    return {
      stats: {
        totalEvents,
        activeEvents,
        draftEvents,
        totalGuests,
        totalViews,
        rsvpCount,
        attendingCount,
        rsvpRatio: totalGuests > 0 ? Math.round((rsvpCount / totalGuests) * 1000) / 10 : 0,
      },
      events: events || [],
      recentActivities,
      tasks,
    };
  });
