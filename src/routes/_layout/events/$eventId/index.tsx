import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import * as React from "react";
import { EventContextHeader } from "@/components/event-context-header";
import {
  CheckSquare,
  ArrowRight,
  Paintbrush,
  Users,
  BarChart3,
  Settings,
  CheckCircle2,
  Send,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getRecentActivities } from "@/lib/guests-api";

export const Route = createFileRoute("/_layout/events/$eventId/")({
  loader: async ({ params }) => {
    try {
      const activities = await getRecentActivities({ data: params.eventId });
      return { activities };
    } catch (e) {
      console.error("Gagal memuat aktivitas terbaru:", e);
      return { activities: [] };
    }
  },
  component: EventOverview,
});

const formatTimeAgo = (dateStr: string) => {
  try {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    if (diffMs < 0) return "baru saja"; // handle small system clock drifts
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "baru saja";
    if (diffMins < 60) return `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}j lalu`;
    if (diffDays === 1) return "kemarin";
    return `${diffDays} hari lalu`;
  } catch {
    return dateStr;
  }
};

function EventOverview() {
  const { event } = useLoaderData({ from: "/_layout/events/$eventId" }) as any;
  const { activities } = useLoaderData({ from: "/_layout/events/$eventId/" }) as any;

  const guestCount = event.event_statistics?.guest_count ?? 0;
  const rsvpCount = event.event_statistics?.rsvp_count ?? 0;

  const steps = [
    {
      id: "step-details",
      title: "Buat Informasi Detail Acara",
      desc: "Informasi nama, tanggal, dan lokasi koordinat peta.",
      why: "Tamu memerlukan info tanggal dan rincian lokasi presisi agar tidak tersasar.",
      done: true,
    },
    {
      id: "step-builder",
      title: "Kustomisasi Desain Undangan",
      desc: "Sesuaikan pilihan tema warna, font, galeri, & musik.",
      why: "Personalisasi desain membangkitkan kesan pertama yang memikat bagi para tamu.",
      done: !!event.cover_image || (event.theme_color && event.theme_color !== "#1B4D3E"),
      link: `/events/${event.id}/invitations`,
    },
    {
      id: "step-guests",
      title: "Impor Data Tamu Pertama Anda",
      desc: "Tambahkan tamu secara manual atau unggah file spreadsheet.",
      why: "Mengimpor nama tamu mempermudah pembuatan link distribusi undangan personal.",
      done: guestCount > 0,
      link: `/events/${event.id}/guests`,
    },
    {
      id: "step-send",
      title: "Kirim Undangan & Mulai RSVP",
      desc: "Salin link personal atau gunakan integrasi kirim WhatsApp.",
      why: "Pengiriman personal mendongkrak konfirmasi RSVP & persentase kehadiran tamu.",
      done: rsvpCount > 0,
      link: `/events/${event.id}/guests`,
    },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  const getRecommendation = () => {
    if (completedSteps === 4) {
      return {
        title: "Persiapan Siap & Selesai!",
        desc: "Undangan digital Anda telah terdesain, data tamu diimpor, dan respon RSVP mulai masuk secara riil. Pantau statistik dan laporan kehadiran secara berkala.",
        cta: "Lihat Analitis",
        link: `/events/${event.id}/analytics`,
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" strokeWidth={1.5} />,
      };
    }
    if (!steps[1].done) {
      return {
        title: "Kustomisasi Desain Undangan Anda",
        desc: "Undangan Anda masih menggunakan tema bawaan. Tambahkan foto cover unik dan ubah warna tema di Builder untuk memberikan sentuhan personal.",
        cta: "Buka Builder Desain",
        link: `/events/${event.id}/invitations`,
        icon: <Paintbrush className="h-5 w-5 text-pink-500 shrink-0" strokeWidth={1.5} />,
      };
    }
    if (!steps[2].done) {
      return {
        title: "Impor Daftar Tamu Undangan",
        desc: "Desain undangan Anda sudah disesuaikan. Sekarang, impor daftar nama tamu undangan dari template spreadsheet Excel untuk generate link personal mereka.",
        cta: "Impor Tamu Sekarang",
        link: `/events/${event.id}/guests`,
        icon: <Users className="h-5 w-5 text-indigo-500 shrink-0" strokeWidth={1.5} />,
      };
    }
    return {
      title: "Kirim Undangan Pertama Anda",
      desc: "Daftar tamu sudah terdaftar. Bagikan tautan undangan personal kepada tamu Anda via WhatsApp atau email untuk mulai mengumpulkan konfirmasi kehadiran.",
      cta: "Kirim Undangan",
      link: `/events/${event.id}/guests`,
      icon: <Send className="h-5 w-5 text-emerald-500 shrink-0" strokeWidth={1.5} />,
    };
  };

  const rec = getRecommendation();

  const actionShortcuts = [
    {
      title: "Tambah Tamu Baru",
      desc: "Tambah manual nama ke list.",
      icon: <Users className="h-4 w-4 text-indigo-500" strokeWidth={1.5} />,
      url: `/events/${event.id}/guests`,
    },
    {
      title: "Builder Desain",
      desc: "Atur font, palet, & galeri.",
      icon: <Paintbrush className="h-4 w-4 text-pink-500" strokeWidth={1.5} />,
      url: `/events/${event.id}/invitations`,
    },
    {
      title: "Laporan RSVP",
      desc: "Analisis konfirmasi tamu.",
      icon: <BarChart3 className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />,
      url: `/events/${event.id}/analytics`,
    },
    {
      title: "Setelan Kustom Domain",
      desc: "Hubungkan domain sendiri.",
      icon: <Settings className="h-4 w-4 text-amber-500" strokeWidth={1.5} />,
      url: `/events/${event.id}/settings`,
    },
  ];

  return (
    <div className="space-y-6">
      <EventContextHeader event={event} />

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Setup Progress Widget */}
          <div className="bg-paper/20 border border-rule/50 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-semibold text-ink">Persiapan Acara</h4>
                <span className="font-mono text-xs text-primary font-bold">
                  {completedSteps} dari {steps.length} selesai ({progressPercent}%)
                </span>
              </div>
              <Progress value={progressPercent} className="h-1 bg-rule/20 rounded-full" />
            </div>

            <div className="space-y-3.5 pt-1">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-start justify-between p-4 bg-white border border-rule/35 rounded-xl transition-all duration-200 hover:shadow-xs group"
                >
                  <div className="flex gap-3.5 pr-2">
                    <input
                      type="checkbox"
                      checked={step.done}
                      readOnly
                      className="mt-0.5 h-4 w-4 rounded border-rule text-primary accent-primary cursor-default pointer-events-none"
                    />
                    <div className="space-y-1">
                      <div
                        className={cn(
                          "text-xs font-semibold text-ink transition-all duration-150",
                          step.done && "line-through text-ink-muted/80",
                        )}
                      >
                        {step.title}
                      </div>
                      <div className="text-[10px] text-ink-soft leading-normal">{step.desc}</div>
                      <div className="text-[9px] text-ink-muted italic leading-relaxed pt-0.5">
                        Kenapa ini penting: {step.why}
                      </div>
                    </div>
                  </div>
                  {!step.done && step.link && (
                    <Button
                      asChild
                      size="xs"
                      variant="ghost"
                      className="h-8 text-[10px] font-semibold text-primary shrink-0 hover:bg-muted/10"
                    >
                      <Link to={step.link}>
                        Mulai{" "}
                        <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contextual Recommendation Banner */}
          <div className="bg-white border border-rule/45 rounded-2xl p-5 md:p-6 flex items-start gap-4 shadow-xs">
            <div className="p-2 bg-paper/40 rounded-xl border border-rule/30 shrink-0">
              {rec.icon}
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div>
                <h5 className="text-xs font-semibold text-ink leading-tight">{rec.title}</h5>
                <p className="text-[10px] text-ink-soft leading-relaxed mt-1">{rec.desc}</p>
              </div>
              <Button
                asChild
                size="sm"
                className="text-[10px] h-8 px-3.5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-none font-semibold font-mono uppercase tracking-wider"
              >
                <Link to={rec.link}>
                  {rec.cta} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          {/* Continue Working Shortcuts */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-ink-muted">
              Continue Working
            </h4>
            <div className="grid gap-3">
              {actionShortcuts.map((action, i) => (
                <Link
                  key={i}
                  to={action.url}
                  className="flex items-start gap-3.5 p-4 bg-white border border-rule/40 rounded-2xl hover:border-rule-strong hover:shadow-xs transition-all text-left group"
                >
                  <div className="p-2 bg-paper/50 rounded-xl border border-rule/30 shrink-0 group-hover:bg-paper">
                    {action.icon}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-semibold text-ink flex items-center gap-1 group-hover:text-primary transition-colors">
                      {action.title}
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-150" />
                    </div>
                    <p className="text-[10px] text-ink-soft leading-normal">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity stream */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-ink-muted flex items-center justify-between">
              <span>Recent Activity</span>
              <span className="flex items-center gap-1 text-[9px] text-primary/80 lowercase tracking-normal font-semibold font-sans">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                live syncing
              </span>
            </h4>

            <div className="bg-white border border-rule/40 rounded-2xl p-5 shadow-xs space-y-4">
              {activities.length === 0 ? (
                <div className="border border-dashed border-rule rounded-xl py-12 px-4 text-center bg-paper/10">
                  <Clock className="mx-auto h-7 w-7 text-rule/75" strokeWidth={1} />
                  <h5 className="mt-3.5 text-xs font-semibold text-ink">Belum Ada Aktivitas</h5>
                  <p className="mt-1 text-[10px] text-ink-soft max-w-[210px] mx-auto leading-relaxed">
                    Log RSVP dan scan check-in tamu undangan akan otomatis muncul di sini setelah
                    Anda membagikan link.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-2 before:top-2.5 before:bottom-2 before:w-[1px] before:bg-rule/45 max-h-[320px] overflow-y-auto pr-1">
                  {activities.map((act: any) => (
                    <div key={act.id} className="relative pl-6 text-xs group">
                      <span className="absolute left-[5px] top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-4 ring-white" />
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-semibold text-ink leading-tight">
                          {act.guests?.name || "Tamu"}
                        </span>
                        <span className="font-mono text-[9px] text-ink-muted shrink-0">
                          {formatTimeAgo(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-soft mt-0.5 leading-normal">
                        {act.description}
                      </p>
                      <span className="text-[8px] text-ink-muted/70 font-mono block mt-1 uppercase tracking-wider">
                        Actor: {act.actor}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
