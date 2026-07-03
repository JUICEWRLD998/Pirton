"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark";

interface Props {
  /** Show a "New scan" action while a scan/verdict is on screen. */
  showReset?: boolean;
  onReset?: () => void;
}

/** Sticky top navigation. Translucent, gains a hairline + blur on scroll. */
export function SiteHeader({ showReset, onReset }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled
          ? "border-b border-line/70 bg-bg/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between">
        <a href="#top" className="rounded-lg" aria-label="Pirton home">
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
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
            CROO · Base
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {showReset ? (
            <button onClick={onReset} className="btn-ghost h-10 px-4">
              New scan
            </button>
          ) : (
            <a href="#tool" className="btn-primary h-10">
              Scan something
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
