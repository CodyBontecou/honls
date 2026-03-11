"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations("signup");
  const navT = useTranslations("nav");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("errors.passwordLength"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error || t("errors.error"));
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("errors.accountCreated"));
        router.push("/login");
      } else {
        router.push("/register");
        router.refresh();
      }
    } catch {
      setError(t("errors.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/register" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="font-display tracking-[0.1em]">{navT("home")}</Link>
          <h1 className="font-display text-3xl mt-8 mb-2">{t("title")}</h1>
          <p className="text-muted text-sm">{t("subtitle")}</p>
        </div>

        <div className="border border-subtle p-8">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors mb-8"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t("google")}
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-subtle" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-xs text-faint">{t("or")}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 border border-accent/50 text-sm text-accent">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                {t("fullName")}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                {t("email")}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                {t("password")}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-faint">{t("passwordNote")}</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                {t("confirmPassword")}
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? t("creating") : t("create")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-accent hover:text-cream transition-colors">{t("signIn")}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
