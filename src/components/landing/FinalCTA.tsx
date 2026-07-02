import { Link } from "@tanstack/react-router";

export function FinalCTA() {
  return (
    <section className="border-t border-rule bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[6fr_5fr] items-start">
          {/* FAQ Column */}
          <div>
            <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-primary font-semibold">
              Frequently Asked Questions
            </div>
            <div className="space-y-8">
              <div>
                <h4 className="font-sans text-base text-ink font-bold">
                  Can I use my own custom domain?
                </h4>
                <p className="mt-2 text-xs text-ink-soft leading-relaxed max-w-md">
                  Yes. On the Premium plan, you can link custom domains or subdomains (e.g.,
                  event.yourbrand.com) for clean, professional invitation URLs.
                </p>
              </div>
              <div>
                <h4 className="font-sans text-base text-ink font-bold">
                  How do entrance QR check-ins work?
                </h4>
                <p className="mt-2 text-xs text-ink-soft leading-relaxed max-w-md">
                  Each confirmed guest receives a secure, unique QR-code entrance pass. Your door
                  team can scan these tickets using any smartphone camera to check guests in
                  instantly.
                </p>
              </div>
              <div>
                <h4 className="font-sans text-base text-ink font-bold">
                  Can I export my attendance and guest databases?
                </h4>
                <p className="mt-2 text-xs text-ink-soft leading-relaxed max-w-md">
                  Yes. All guest details, seating coordinates, dietary preferences, and check-in
                  logs can be exported as a standard CSV file at any time.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Column */}
          <div className="rounded-2xl bg-ink p-8 text-white shadow-xl">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-white/50 font-semibold">
              Get Started
            </div>
            <h3 className="font-sans text-2xl leading-tight text-white font-extrabold">
              Ready to build <br />
              <span className="italic text-white/70">your next event?</span>
            </h3>
            <p className="mt-4 text-xs text-white/80 leading-relaxed">
              Create a free account in minutes and upgrade to the Premium Event Pass at any time.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-white py-3 text-xs font-sans font-bold uppercase tracking-wider text-ink transition-all duration-200 hover:bg-white/90 shadow cursor-pointer"
              >
                Get started free
              </Link>
              <a
                href="#pricing"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 py-3 text-xs font-sans font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-white/5 cursor-pointer"
              >
                View pricing
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
