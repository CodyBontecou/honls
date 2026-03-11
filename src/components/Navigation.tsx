"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export function Navigation() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-sm border-b border-subtle" : ""
      }`}
    >
      <nav className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="font-display tracking-[0.1em]">
            Honl's Classic
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-10">
            <Link href="/#about" className="text-sm text-muted hover:text-cream transition-colors">
              About
            </Link>
            <Link href="/#divisions" className="text-sm text-muted hover:text-cream transition-colors">
              Divisions
            </Link>
            <Link href="/#schedule" className="text-sm text-muted hover:text-cream transition-colors">
              Schedule
            </Link>
            <Link href="/standings" className="text-sm text-muted hover:text-cream transition-colors">
              Standings
            </Link>
            
            {status === "loading" ? (
              <div className="w-16 h-8 bg-card animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-6">
                <Link href="/dashboard" className="text-sm text-accent hover:text-cream transition-colors">
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-muted hover:text-cream transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-sm text-accent hover:text-cream transition-colors">
                Login
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2"
            aria-label="Menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`w-full h-px bg-neutral-800 transition-all ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
              <span className={`w-full h-px bg-neutral-800 transition-all ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`w-full h-px bg-neutral-800 transition-all ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-6 border-t border-subtle space-y-4">
            <Link href="/#about" className="block text-muted" onClick={() => setMobileOpen(false)}>About</Link>
            <Link href="/#divisions" className="block text-muted" onClick={() => setMobileOpen(false)}>Divisions</Link>
            <Link href="/#schedule" className="block text-muted" onClick={() => setMobileOpen(false)}>Schedule</Link>
            <Link href="/standings" className="block text-muted" onClick={() => setMobileOpen(false)}>Standings</Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block text-accent" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <button onClick={() => signOut()} className="block text-muted">Sign Out</button>
              </>
            ) : (
              <Link href="/login" className="block text-accent" onClick={() => setMobileOpen(false)}>Login</Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
