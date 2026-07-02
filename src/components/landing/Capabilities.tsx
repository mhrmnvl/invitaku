import { PenTool, Users, BarChart3 } from "lucide-react";

export function Capabilities() {
  return (
    <section id="capabilities" className="border-t border-rule bg-slate-50/30">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="mb-16 max-w-2xl">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-primary font-semibold">
            Capabilities
          </div>
          <h2 className="font-sans text-3xl font-extrabold leading-tight text-ink md:text-4xl">
            Everything you need to orchestrate events, in one calm workspace.
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Col 1 */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-primary">01 /</span>
              <h3 className="font-sans text-lg font-bold text-ink">The Invitation</h3>
            </div>
            <p className="mt-4 text-sm text-ink-soft leading-relaxed min-h-[72px]">
              Design premium digital invitation sites using clean layout templates and classic
              typography. Edit text inline in real time with our distraction-free canvas.
            </p>
            <div className="mt-8 rounded-2xl border border-rule/85 bg-white p-6 flex-1 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink-soft mb-3">
                Typography Presets
              </div>
              <div className="space-y-3 font-sans text-sm">
                <div className="border-b border-rule/60 pb-2 flex items-center justify-between">
                  <span>Editorial Serif</span>
                  <span className="font-mono text-[10px] text-primary font-bold">Selected</span>
                </div>
                <div className="border-b border-rule/60 pb-2 text-ink-soft">Classic Monospace</div>
                <div className="text-ink-soft">Modern Sans-Serif</div>
              </div>
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-primary">02 /</span>
              <h3 className="font-sans text-lg font-bold text-ink">The Registry</h3>
            </div>
            <p className="mt-4 text-sm text-ink-soft leading-relaxed min-h-[72px]">
              Manage your guest database with custom fields for dietary requirements, groups, and
              seating arrangements. Track RSVPs instantly as guests confirm.
            </p>
            <div className="mt-8 rounded-2xl border border-rule/85 bg-white p-6 flex-1 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink-soft mb-3">
                Live Confirmed Parties
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-primary/5 p-2.5 border border-primary/10 rounded-xl text-primary font-medium">
                  <span>Rania Aditya</span>
                  <span className="font-mono text-[10px]">Party of 2 · Attending</span>
                </div>
                <div className="flex justify-between items-center p-2.5 border border-rule/80 rounded-xl text-ink-soft bg-slate-50/30">
                  <span>Bimo Kartika</span>
                  <span className="font-mono text-[10px]">Party of 1 · Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-primary">03 /</span>
              <h3 className="font-sans text-lg font-bold text-ink">The Gate</h3>
            </div>
            <p className="mt-4 text-sm text-ink-soft leading-relaxed min-h-[72px]">
              Scan personalized QR tickets at the entrance to manage entry lists instantly. Monitor
              attendance rates and metrics live on your dashboard.
            </p>
            <div className="mt-8 rounded-2xl border border-rule/85 bg-white p-6 flex-1 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="font-mono text-[9px] uppercase tracking-widest text-ink-soft mb-3">
                Entrance Verification
              </div>
              <div className="flex flex-col items-center justify-center p-5 border border-primary/20 bg-primary/5 rounded-2xl">
                <div className="text-center font-sans text-sm text-primary font-bold">
                  Ticket Validated
                </div>
                <div className="text-center font-mono text-[9px] text-ink-soft mt-1">
                  Check-in Complete
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
