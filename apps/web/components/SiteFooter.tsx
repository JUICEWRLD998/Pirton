import { Wordmark } from "./Wordmark";

/** Minimal footer with a spectrum hairline. */
export function SiteFooter() {
  return (
    <footer className="relative border-t border-line/70">
      {/* top spectrum hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
      <div className="container-x flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Wordmark />
          <p className="text-xs text-slate-500">
            The immune system for the agent economy.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <a href="#how" className="transition-colors hover:text-white">
            How it works
          </a>
          <a href="#agents" className="transition-colors hover:text-white">
            The agents
          </a>
          <a
            href="https://agent.croo.network"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            CROO Agent Store
          </a>
          <span className="text-slate-600">Built on Base · MIT</span>
        </div>
      </div>
    </footer>
  );
}
