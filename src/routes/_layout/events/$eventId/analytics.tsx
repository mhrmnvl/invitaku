import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Loader2,
  Wifi,
  WifiOff,
  Send,
  RefreshCw,
} from "lucide-react";
import { EventContextHeader } from "@/components/event-context-header";
import { getEventAnalytics, type AnalyticsSnapshot } from "@/lib/analytics-api";
import { useAnalyticsRealtime } from "@/hooks/use-analytics-realtime";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const Route = createFileRoute("/_layout/events/$eventId/analytics")({
  loader: async ({ params }) => {
    const snapshot = await getEventAnalytics({ data: { eventId: params.eventId } });
    return { snapshot };
  },
  component: AnalyticsPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSecondsAgo(seconds: number): string {
  if (seconds < 10) return "baru saja";
  if (seconds < 60) return `${seconds}d lalu`;
  const mins = Math.floor(seconds / 60);
  return `${mins} mnt lalu`;
}

function formatActivityTime(timestamp: string): string {
  if (!timestamp) return "";
  try {
    return format(parseISO(timestamp), "HH:mm", { locale: localeId });
  } catch {
    return "";
  }
}

function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM", { locale: localeId });
  } catch {
    return dateStr.slice(5); // MM-DD fallback
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  highlight?: boolean;
  isRefreshing?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, highlight, isRefreshing }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 bg-white transition-all duration-300",
        highlight ? "border-primary/30 bg-primary/[0.02] shadow-sm" : "border-rule/50 shadow-xs",
      )}
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-semibold">
          {label}
        </span>
        <div className={cn("p-1.5 rounded-lg", highlight ? "bg-primary/10" : "bg-slate-50")}>
          <Icon
            className={cn("h-3.5 w-3.5", highlight ? "text-primary" : "text-ink-soft")}
            strokeWidth={1.5}
          />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span
          className={cn(
            "font-sans font-bold text-3xl transition-all duration-300",
            isRefreshing ? "opacity-60 blur-[1px]" : "opacity-100 blur-0",
            highlight ? "text-primary" : "text-ink",
          )}
        >
          {typeof value === "number" ? value.toLocaleString("id-ID") : value}
        </span>
        {isRefreshing && <Loader2 className="h-3 w-3 text-primary animate-spin mb-1.5" />}
      </div>
      {sub && <span className="font-mono text-[9px] text-ink-soft mt-1 block">{sub}</span>}
    </div>
  );
}

// ─── RSVP Donut ───────────────────────────────────────────────────────────────

function RsvpDonut({
  attending,
  declining,
  pending,
  total,
}: {
  attending: number;
  declining: number;
  pending: number;
  total: number;
}) {
  const hadiPct = total > 0 ? (attending / total) * 100 : 0;
  const tolakPct = total > 0 ? (declining / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <h4 className="font-sans font-bold text-base text-ink">Distribusi RSVP</h4>

      {/* Stacked progress bar */}
      <div className="h-3 rounded-full overflow-hidden bg-slate-100 flex">
        <div
          className="bg-emerald-500 transition-all duration-700"
          style={{ width: `${hadiPct}%` }}
        />
        <div
          className="bg-rose-400 transition-all duration-700"
          style={{ width: `${tolakPct}%` }}
        />
        <div
          className="bg-amber-300 transition-all duration-700"
          style={{ width: `${pendingPct}%` }}
        />
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {[
          { label: "Hadir", count: attending, color: "bg-emerald-500", pct: hadiPct },
          { label: "Tidak Hadir", count: declining, color: "bg-rose-400", pct: tolakPct },
          { label: "Menunggu", count: pending, color: "bg-amber-300", pct: pendingPct },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full shrink-0", item.color)} />
              <span className="text-ink-soft">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-ink">
                {item.count.toLocaleString("id-ID")}
              </span>
              <span className="font-mono text-[9px] text-ink-soft">{item.pct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      {total === 0 && (
        <p className="text-[11px] text-ink-soft italic text-center py-2">
          Belum ada RSVP yang masuk.
        </p>
      )}
    </div>
  );
}

// ─── RSVP Timeline Bar Chart ──────────────────────────────────────────────────

function RsvpTimeline({ data }: { data: { date: string; count: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  // Only show every 5th label to avoid crowding
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="font-sans font-bold text-base text-ink">RSVP Timeline</h3>
        </div>
        <span className="font-mono text-[9px] text-ink-soft">30 Hari Terakhir</span>
      </div>

      <div className="bg-slate-50/60 border border-rule/35 rounded-xl p-4 h-44 flex items-end gap-1">
        {data.map((point, i) => {
          const heightPct = maxVal > 0 ? (point.count / maxVal) * 100 : 0;
          const showLabel = i % labelEvery === 0;
          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
              title={`${formatShortDate(point.date)}: ${point.count} RSVP`}
            >
              {/* Tooltip */}
              {point.count > 0 && (
                <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[8px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {point.count}
                </div>
              )}
              <div
                style={{ height: `${Math.max(heightPct, point.count > 0 ? 4 : 0)}%` }}
                className={cn(
                  "w-full rounded-t-[2px] min-h-[2px] transition-all duration-500",
                  point.count > 0 ? "bg-primary" : "bg-slate-200",
                )}
              />
              {showLabel && (
                <span className="font-mono text-[7px] text-ink-soft rotate-0 select-none">
                  {formatShortDate(point.date)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {data.every((d) => d.count === 0) && (
        <p className="text-[11px] text-ink-soft italic text-center -mt-2">
          Belum ada RSVP dalam 30 hari terakhir.
        </p>
      )}
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed({
  activities,
}: {
  activities: {
    id: string;
    guestName: string;
    actor: string;
    description: string;
    timestamp: string;
  }[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h3 className="font-sans font-bold text-base text-ink">Aktivitas Terbaru</h3>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {activities.length === 0 && (
          <div className="text-center py-8 text-[11px] text-ink-soft italic">
            Belum ada aktivitas yang tercatat.
          </div>
        )}
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-slate-50/60 border border-rule/30 rounded-xl text-xs animate-in slide-in-from-top-1 duration-200"
          >
            <div className="p-1.5 bg-white rounded-lg border border-rule/35 shrink-0 mt-0.5">
              <Activity className="h-3 w-3 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink truncate">{activity.guestName}</span>
                {activity.timestamp && (
                  <span className="font-mono text-[9px] text-ink-soft shrink-0">
                    {formatActivityTime(activity.timestamp)}
                  </span>
                )}
              </div>
              <p className="text-ink-soft text-[11px] mt-0.5 leading-snug">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AnalyticsPage() {
  const { event: activeEvent } = useLoaderData({ from: "/_layout/events/$eventId" }) as any;
  const { snapshot } = useLoaderData({ from: "/_layout/events/$eventId/analytics" }) as {
    snapshot: AnalyticsSnapshot;
  };

  const { data, isLive, isRefreshing, secondsAgo } = useAnalyticsRealtime(activeEvent.id, snapshot);

  const { stats, rsvpTimeline, recentActivities } = data;

  return (
    <div className="space-y-6">
      <EventContextHeader event={activeEvent} />

      <div className="bg-white rounded-2xl border border-rule/50 p-6 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule/30 pb-4">
          <div>
            <h4 className="text-sm font-semibold text-ink">Analytics & Insights</h4>
            <p className="text-[11px] text-ink-soft">
              Data langsung dari undangan Anda — diperbarui secara realtime.
            </p>
          </div>

          {/* Live status indicator */}
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <span className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Memperbarui...
              </span>
            )}
            {secondsAgo > 0 && !isRefreshing && (
              <span className="font-mono text-[10px] text-ink-soft">
                Diperbarui {formatSecondsAgo(secondsAgo)}
              </span>
            )}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border transition-all",
                isLive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200",
              )}
            >
              {isLive ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                  <Wifi className="h-3 w-3" />
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Tamu"
            value={stats.totalGuests}
            sub="Terdaftar dalam daftar tamu"
            icon={Users}
            isRefreshing={isRefreshing}
          />
          <StatCard
            label="RSVP Masuk"
            value={stats.rsvpCount}
            sub={`${stats.conversionRate}% conversion rate`}
            icon={CheckCircle2}
            highlight
            isRefreshing={isRefreshing}
          />
          <StatCard
            label="Undangan Terkirim"
            value={stats.totalInvitationsSent}
            sub="Status Sent + Viewed"
            icon={Send}
            isRefreshing={isRefreshing}
          />
          <StatCard
            label="Total Views"
            value={stats.totalViews}
            sub="Akumulasi pembukaan undangan"
            icon={Eye}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* RSVP Breakdown mini stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Hadir",
              val: stats.attendingCount,
              icon: CheckCircle2,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              border: "border-emerald-100",
            },
            {
              label: "Tidak Hadir",
              val: stats.decliningCount,
              icon: XCircle,
              color: "text-rose-600",
              bg: "bg-rose-50",
              border: "border-rose-100",
            },
            {
              label: "Pending",
              val: stats.pendingCount,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
              border: "border-amber-100",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={cn("rounded-xl border p-4 flex items-center gap-3", item.bg, item.border)}
            >
              <div className="p-2 bg-white rounded-lg shadow-xs">
                <item.icon className={cn("h-4 w-4", item.color)} strokeWidth={1.5} />
              </div>
              <div>
                <span
                  className={cn(
                    "text-xl font-sans font-bold block transition-all duration-300",
                    item.color,
                    isRefreshing ? "opacity-60 blur-[1px]" : "",
                  )}
                >
                  {item.val.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] font-mono text-ink-soft uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline + Distribution */}
        <div className="grid gap-6 lg:grid-cols-[7fr_4fr]">
          <div className="rounded-xl border border-rule/40 p-5 bg-white space-y-4">
            <RsvpTimeline data={rsvpTimeline} />
          </div>
          <div className="rounded-xl border border-rule/40 p-5 bg-white space-y-4">
            <RsvpDonut
              attending={stats.attendingCount}
              declining={stats.decliningCount}
              pending={stats.pendingCount}
              total={stats.rsvpCount}
            />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl border border-rule/40 p-5 bg-white">
          <ActivityFeed activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}
