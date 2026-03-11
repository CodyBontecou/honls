"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navigation() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("nav");

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
            {t("home")}
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-10">
            <Link href="/#about" className="text-sm text-muted hover:text-cream transition-colors">
              {t("about")}
            </Link>
            <Link href="/#divisions" className="text-sm text-muted hover:text-cream transition-colors">
              {t("divisions")}
            </Link>
            <Link href="/#schedule" className="text-sm text-muted hover:text-cream transition-colors">
              {t("schedule")}
            </Link>
            <Link href="/standings" className="text-sm text-muted hover:text-cream transition-colors">
              {t("standings")}
            </Link>
            
            {status === "loading" ? (
              <div className="w-16 h-8 bg-card animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-6">
                <Link href="/dashboard" className="text-sm text-accent hover:text-cream transition-colors">
                  {t("dashboard")}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-muted hover:text-cream transition-colors"
                >
                  {t("signOut")}
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-sm text-accent hover:text-cream transition-colors">
                {t("login")}
              </Link>
            )}

            <LanguageSwitcher />
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2"
            aria-label={t("menu")}
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
            <Link href="/#about" className="block text-muted" onClick={() => setMobileOpen(false)}>{t("about")}</Link>
            <Link href="/#divisions" className="block text-muted" onClick={() => setMobileOpen(false)}>{t("divisions")}</Link>
            <Link href="/#schedule" className="block text-muted" onClick={() => setMobileOpen(false)}>{t("schedule")}</Link>
            <Link href="/standings" className="block text-muted" onClick={() => setMobileOpen(false)}>{t("standings")}</Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block text-accent" onClick={() => setMobileOpen(false)}>{t("dashboard")}</Link>
                <button onClick={() => signOut()} className="block text-muted">{t("signOut")}</button>
              </>
            ) : (
              <Link href="/login" className="block text-accent" onClick={() => setMobileOpen(false)}>{t("login")}</Link>
            )}
            <div className="pt-4 border-t border-subtle">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
