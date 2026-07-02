const COLS = [
  { t: "Product", l: ["Capabilities", "Pricing", "Changelog"] },
  { t: "Company", l: ["About", "Contact"] },
  { t: "Resources", l: ["Docs", "Help center"] },
  { t: "Legal", l: ["Privacy", "Terms", "Security"] },
];

export function Footer() {
  return (
    <footer className="border-t border-rule bg-ink text-paper">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[3fr_5fr]">
          <div>
            <div className="flex items-center gap-2 font-sans text-xl text-white font-bold tracking-tight">
              <img
                src="/logo-small.png"
                alt="Invitaku"
                className="h-7 w-7 object-contain invert brightness-0"
              />
              <span>Invitaku</span>
            </div>
            <p className="mt-3 max-w-xs text-xs text-paper/60 leading-relaxed">
              Consolidating invitations, RSVP registries, and gate check-in verification in a single
              editorial workspace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLS.map((c) => (
              <div key={c.t}>
                <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.24em] text-paper/40">
                  {c.t}
                </div>
                <ul className="space-y-2.5 text-xs text-paper/70 font-mono">
                  {c.l.map((i) => (
                    <li key={i}>
                      <a
                        href="#"
                        className="transition-colors duration-100 ease-out hover:text-white"
                      >
                        {i}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-paper/10 pt-8 font-mono text-[9px] uppercase tracking-[0.24em] text-paper/40">
          <div>© 2026 Invitaku · All rights reserved</div>
          <div>Bandung, Indonesia</div>
        </div>
      </div>
    </footer>
  );
}
