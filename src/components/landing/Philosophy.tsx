import { ArrowRight } from "lucide-react";

export function Philosophy() {
  return (
    <section id="philosophy" className="border-t border-rule bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[5fr_7fr] items-start">
          <div>
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.24em] text-primary font-semibold">
              Philosophy
            </div>
            <h2 className="font-sans text-3xl font-extrabold leading-tight text-ink md:text-4xl">
              Event organization, <span className="italic text-ink-soft">minus the overhead.</span>
            </h2>
            <p className="mt-6 max-w-md text-ink-soft text-sm leading-relaxed">
              Managing guest lists across spreadsheets, group chats, and printers leads to
              fragmented data and last-minute errors. We consolidate your workflows into a single
              workspace.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* Before */}
            <div className="rounded-2xl border border-rule bg-slate-50/50 p-6 shadow-sm">
              <div className="font-mono text-[9px] uppercase tracking-widest text-red-500 font-bold mb-4">
                The Old Way · Fragmented
              </div>
              <ul className="space-y-4 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-mono font-bold">✕</span>
                  <span>Manual copy-paste of RSVPs from WhatsApp chats into spreadsheets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-mono font-bold">✕</span>
                  <span>
                    No delivery tracking; unable to confirm who received or read the link.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-mono font-bold">✕</span>
                  <span>
                    Guest check-ins at the door managed with printed paper lists and clipboards.
                  </span>
                </li>
              </ul>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
              <div className="font-mono text-[9px] uppercase tracking-widest text-primary font-bold mb-4">
                The Invitaku Way · Consolidated
              </div>
              <ul className="space-y-4 text-xs text-ink">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold">✓</span>
                  <span>Real-time database syncs confirmations directly from guest responses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold">✓</span>
                  <span>
                    Immediate insight into delivery rates, clicks, and confirmation trends.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-mono font-bold">✓</span>
                  <span>Seamless QR-code ticket scans update check-in counts live.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Central Callout Banner */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-rule/80 bg-slate-50/30 p-8 shadow-sm">
          <div className="max-w-xl">
            <h3 className="font-sans text-xl font-bold text-ink">
              One platform. From design to check-in.
            </h3>
            <p className="mt-2 text-xs text-ink-soft leading-relaxed">
              We align invitations, guest lists, and gate operations. By keeping your entire flow in
              one system, we prevent data duplication and coordinate error-free operations.
            </p>
          </div>
          <a
            href="#capabilities"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-sans font-bold uppercase tracking-wider text-white transition-all duration-150 hover:bg-primary/95 shadow-sm hover:shadow"
          >
            Explore capabilities
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </section>
  );
}
