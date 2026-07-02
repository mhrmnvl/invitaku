export function Testimonials() {
  return (
    <section className="border-t border-rule bg-paper">
      <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-soft">
            Endorsement
          </div>
          <blockquote className="font-sans text-xl md:text-2xl text-ink leading-relaxed font-medium tracking-tight">
            “We ran three weddings in one weekend using Invitaku. Every RSVP, dietary request, and
            entrance ticket scan remained completely synced in a single workspace. It has simplified
            our entire operational workflow.”
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-mono text-xs text-white font-bold">
              SW
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-ink">Salma Wibowo</div>
              <div className="text-xs text-ink-soft">Founder, Kirana Wedding Co.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
