import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, AlertCircle, ArrowUpRight, CheckSquare, Clock } from "lucide-react";
import * as React from "react";
import { getDashboardOverviewData } from "@/lib/analytics-api";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_layout/dashboard")({
  loader: async () => {
    try {
      return await getDashboardOverviewData({ data: {} });
    } catch (e: any) {
      console.error("Gagal memuat data dashboard:", e);
      return {
        stats: {
          totalEvents: 0,
          activeEvents: 0,
          draftEvents: 0,
          totalGuests: 0,
          totalViews: 0,
          rsvpCount: 0,
          attendingCount: 0,
          rsvpRatio: 0,
        },
        events: [],
        recentActivities: [],
        tasks: [],
      };
    }
  },
  component: DashboardOverview,
});

function DashboardOverview() {
  const { stats, events, recentActivities, tasks } = Route.useLoaderData();
  const [userName, setUserName] = React.useState("User");

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User",
        );
      }
    });
  }, []);

  const todayStr = format(new Date(), "EEEE · d MMMM yyyy", { locale: localeId });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
            {todayStr}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-ink mt-0.5">
            Selamat Datang, {userName}
          </h2>
        </div>
        <Button
          asChild
          size="sm"
          className="rounded-md font-mono text-[10px] uppercase tracking-widest h-9"
        >
          <Link to="/events/new">+ Buat Acara</Link>
        </Button>
      </div>

      {/* Grid: 3 metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Q1 Metric */}
        <Card className="rounded-xl border border-rule/35 bg-white shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
              Total Acara Workspace
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-ink">{stats.totalEvents}</span>
            <span className="font-mono text-[10px] text-ink-soft">
              {stats.draftEvents} Draf · {stats.activeEvents} Aktif
            </span>
          </CardContent>
        </Card>

        {/* Q2 Metric */}
        <Card className="rounded-xl border border-rule/35 bg-white shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
              Total Tamu Diundang
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-ink">
              {stats.totalGuests.toLocaleString("id-ID")}
            </span>
            <span className="font-mono text-[10px] text-ink-soft">Orang terdaftar</span>
          </CardContent>
        </Card>

        {/* Q3 Metric */}
        <Card className="rounded-xl border border-rule/35 bg-white shadow-xs">
          <CardHeader className="p-4 pb-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
              Rasio Konfirmasi RSVP
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-ink">{stats.rsvpRatio}%</span>
            <span className="font-mono text-[10px] text-primary font-medium">
              {stats.attendingCount} hadir dari {stats.rsvpCount} RSVP
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main split dashboard view */}
      <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
        <div className="space-y-6">
          {/* Q4 Checklist Widget */}
          <Card className="rounded-xl border border-rule/35 bg-white shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 flex flex-row items-center gap-2 space-y-0">
              <CheckSquare className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h3 className="text-base font-semibold text-ink">Langkah Anda Hari Ini</h3>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2.5">
              {tasks.length === 0 ? (
                <div className="text-xs text-ink-soft p-4 bg-paper rounded-lg border border-rule text-center">
                  Semua tugas setup selesai! Workspace Anda siap.
                </div>
              ) : (
                tasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 bg-paper border border-rule px-4 py-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={t.checked}
                        disabled
                        className="h-4 w-4 border-rule text-primary accent-primary"
                      />
                      <span
                        className={`text-xs ${t.checked ? "line-through text-ink-soft" : "text-ink font-medium"}`}
                      >
                        {t.text}
                      </span>
                    </div>
                    {t.urgency === "high" && !t.checked && (
                      <Badge
                        variant="destructive"
                        className="rounded-[4px] px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-mono font-semibold"
                      >
                        Penting
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Events Overview Table */}
          <Card className="rounded-xl border border-rule/35 bg-white shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
              <h3 className="text-base font-semibold text-ink">Daftar Acara Aktif</h3>
              <Link
                to="/events"
                className="text-xs text-ink-soft hover:text-ink transition-colors duration-100 flex items-center gap-1"
              >
                Lihat semua <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-paper border-b border-rule hover:bg-paper">
                    <TableHead className="h-8 font-mono text-[9px] uppercase tracking-widest text-ink-soft px-4">
                      Nama Acara
                    </TableHead>
                    <TableHead className="h-8 font-mono text-[9px] uppercase tracking-widest text-ink-soft px-4">
                      Tanggal Acara
                    </TableHead>
                    <TableHead className="h-8 font-mono text-[9px] uppercase tracking-widest text-ink-soft px-4">
                      Tamu / RSVP
                    </TableHead>
                    <TableHead className="h-8 font-mono text-[9px] uppercase tracking-widest text-ink-soft px-4 w-[100px]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-xs text-ink-soft">
                        Belum ada acara dibuat. Silakan klik "Buat Acara" di atas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((e: any, idx: number) => {
                      const statsObj = e.event_statistics?.[0] || {};
                      return (
                        <TableRow
                          key={idx}
                          className="border-b border-rule hover:bg-slate-50 transition-colors"
                        >
                          <TableCell className="px-4 py-3">
                            <Link
                              to={`/events/${e.id}`}
                              className="font-semibold text-sm text-ink hover:underline"
                            >
                              {e.name}
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-ink-soft font-mono">
                            {e.start_date ? format(new Date(e.start_date), "dd MMM yyyy") : "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-ink font-mono">
                            {statsObj.guest_count || 0} Tamu ({statsObj.rsvp_count || 0} RSVP)
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge
                              variant={e.status === "Published" ? "default" : "secondary"}
                              className="rounded-[4px] px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-mono font-semibold"
                            >
                              {e.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Real-time RSVP Activity feed */}
        <Card className="rounded-xl border border-rule/35 bg-white shadow-xs overflow-hidden h-[450px] flex flex-col justify-between">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-rule/30">
            <h3 className="text-base font-semibold text-ink">Aktivitas RSVP Tamu</h3>
            <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-ink-soft">
              <Clock className="h-3 w-3 animate-pulse" /> Sinkron Aktif
            </span>
          </CardHeader>
          <ScrollArea className="flex-1 p-5">
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-soft">
                  Belum ada aktivitas konfirmasi RSVP masuk.
                </div>
              ) : (
                recentActivities.map((act: any, i: number) => (
                  <div
                    key={i}
                    className="text-xs pb-3 border-b border-rule/35 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-semibold text-ink">{act.guest}</span>
                      <span className="font-mono text-[9px] text-ink-soft shrink-0">
                        {act.time}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span
                        className={`font-mono text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-[3px] font-semibold ${
                          act.action === "RSVP"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-paper text-ink-soft border border-rule/50"
                        }`}
                      >
                        {act.action}
                      </span>
                      <span className="text-ink-soft">{act.details}</span>
                    </div>
                    <div className="mt-2 text-[10px] text-ink-soft">
                      Acara: <span className="font-semibold text-ink">{act.event}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
