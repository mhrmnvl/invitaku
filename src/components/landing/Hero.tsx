import { Check, Calendar, Users, BarChart3, QrCode } from "lucide-react";
import { Link } from "@tanstack/react-router";

function DashboardMock() {
  return (
    <div className="relative">
      {/* Dashboard card */}
      <div className="rounded-2xl border border-rule/85 bg-white shadow-xl overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-rule/70 px-4 py-3 bg-slate-50/70">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-ink-soft">
            invitaku.app / dashboard
          </span>
        </div>

        <div className="grid grid-cols-[160px_1fr] min-h-[420px]">
          {/* Sidebar */}
          <aside className="border-r border-rule/70 p-4 text-xs bg-slate-50/30">
            <div className="mb-4 font-sans text-sm font-bold text-ink flex items-center gap-2">
              <img src="/logo-small.png" alt="" className="h-6 w-6 object-contain" />
              <span>Invitaku</span>
            </div>
            <ul className="space-y-1 text-ink-soft">
              <li className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-ink font-medium">
                Overview
              </li>
              <li className="px-2.5 py-1.5 hover:text-ink transition-colors duration-100 cursor-pointer rounded-lg hover:bg-slate-50">
                Events
              </li>
              <li className="px-2.5 py-1.5 hover:text-ink transition-colors duration-100 cursor-pointer rounded-lg hover:bg-slate-50">
                Guests
              </li>
              <li className="px-2.5 py-1.5 hover:text-ink transition-colors duration-100 cursor-pointer rounded-lg hover:bg-slate-50">
                Templates
              </li>
              <li className="px-2.5 py-1.5 hover:text-ink transition-colors duration-100 cursor-pointer rounded-lg hover:bg-slate-50">
                Analytics
              </li>
              <li className="px-2.5 py-1.5 hover:text-ink transition-colors duration-100 cursor-pointer rounded-lg hover:bg-slate-50">
                Settings
              </li>
            </ul>
          </aside>

          {/* Main */}
          <div className="p-5 bg-white">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                  Wednesday · Jul 01
                </div>
                <h3 className="font-sans text-base font-bold text-ink">Good morning, Amara</h3>
              </div>
              <div className="rounded-lg border border-rule/80 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-ink hover:bg-slate-50 transition-colors duration-100 cursor-pointer">
                + New event
              </div>
            </div>

            {/* Stats */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { l: "Invitations", v: "1,284" },
                { l: "RSVP Yes", v: "912" },
                { l: "Open rate", v: "84%" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-rule/80 p-3 bg-white shadow-sm">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
                    {s.l}
                  </div>
                  <div className="mt-1 font-sans text-base font-bold text-ink">{s.v}</div>
                </div>
              ))}
            </div>

            {/* Chart + Donut */}
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="rounded-xl border border-rule/80 p-3 bg-white shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
                    RSVP timeline
                  </span>
                  <span className="font-mono text-[9px] text-ink-soft">30d</span>
                </div>
                <div className="flex h-20 items-end gap-1.5">
                  {[30, 45, 38, 62, 55, 78, 70, 88, 72, 95, 80, 100].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="flex-1 rounded bg-primary"
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-rule/80 p-3 bg-white shadow-sm flex flex-col items-center">
                <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-ink-soft w-full text-left">
                  Attendance
                </div>
                <div className="relative h-16 w-16">
                  <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="var(--rule)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="3"
                      strokeDasharray="72 100"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-sans text-xs font-bold text-ink">
                    72%
                  </div>
                </div>
              </div>
            </div>

            {/* Guest table */}
            <div className="mt-3 overflow-hidden rounded-xl border border-rule/80 bg-white shadow-sm">
              <div className="grid grid-cols-[1fr_80px_60px] border-b border-rule/80 bg-slate-50/50 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-ink-soft">
                <span>Guest</span>
                <span>Party</span>
                <span>RSVP</span>
              </div>
              {[
                ["Rania Aditya", "2", "Yes"],
                ["Bimo Kartika", "1", "Yes"],
                ["Sarah Wilson", "4", "Maybe"],
              ].map(([n, p, r]) => (
                <div
                  key={n}
                  className="grid grid-cols-[1fr_80px_60px] px-3 py-1.5 text-xs text-ink not-last:border-b not-last:border-rule/50"
                >
                  <span className="font-sans">{n}</span>
                  <span className="font-mono text-ink-soft">{p}</span>
                  <span className={r === "Yes" ? "text-primary font-bold" : "text-ink-soft"}>
                    {r}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile invitation card */}
      <div className="absolute -bottom-8 -left-10 hidden w-[180px] rounded-2xl border border-rule bg-white p-4 shadow-2xl sm:block">
        <div className="rounded-xl bg-primary p-5 text-center text-white">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] opacity-70">
            Together with their families
          </div>
          <div className="my-3 font-sans text-lg font-bold leading-tight">
            Amara <span className="not-italic opacity-70">&</span> Reza
          </div>
          <div className="mx-auto mb-2 h-px w-8 bg-white/20" />
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-80">
            Sat · 14 Sept
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-ink-soft">
          <span>RSVP</span>
          <span className="text-primary font-bold">Open</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/30">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid items-center gap-16 lg:grid-cols-[7fr_5fr]">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-rule/80 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Digital Invitations & Guest Management
            </div>
            <h1 className="font-sans text-4xl font-black leading-[1.1] tracking-tight text-ink md:text-5xl lg:text-[3.8rem]">
              The modern standard for digital invitations
              <br />
              <span className="italic text-ink-soft font-normal">and event operations.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-ink-soft">
              Design premium digital invitations, track RSVPs in real time, and manage guest
              check-ins. Built for weddings, corporate gatherings, and events at scale.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl bg-primary px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-primary/95 shadow-md hover:shadow-lg focus:outline-2 focus:outline-primary focus:outline-offset-2 cursor-pointer"
              >
                Get started free
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center rounded-xl border border-rule bg-white px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-wider text-ink transition-all duration-200 hover:bg-slate-50 shadow-sm hover:shadow focus:outline-2 focus:outline-primary focus:outline-offset-2 cursor-pointer"
              >
                Explore dashboard
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
              {["No credit card", "Free forever", "Setup in minutes"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-12 hidden gap-6 border-t border-rule pt-6 sm:flex">
              {[
                { icon: Calendar, l: "Events" },
                { icon: Users, l: "Guests" },
                { icon: BarChart3, l: "Analytics" },
                { icon: QrCode, l: "Check-in" },
              ].map((f) => (
                <div
                  key={f.l}
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-soft"
                >
                  <f.icon className="h-4 w-4" strokeWidth={1.5} />
                  {f.l}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-4">
            <DashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
}
