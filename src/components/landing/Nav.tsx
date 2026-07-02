import { Link } from "@tanstack/react-router";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 border-b border-rule/50 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-10">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Invitaku" className="h-24 w-auto object-contain -my-4" />
        </Link>
        <nav className="hidden items-center gap-8 text-xs font-mono uppercase tracking-widest text-ink-soft md:flex">
          <a href="#philosophy" className="transition-colors duration-150 hover:text-ink">
            Philosophy
          </a>
          <a href="#capabilities" className="transition-colors duration-150 hover:text-ink">
            Capabilities
          </a>
          <a href="#pricing" className="transition-colors duration-150 hover:text-ink">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider text-ink-soft transition-colors duration-150 hover:text-ink sm:inline-block cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center rounded-xl bg-primary px-5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-primary/95 shadow-sm hover:shadow focus:outline-2 focus:outline-primary focus:outline-offset-2 cursor-pointer"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
