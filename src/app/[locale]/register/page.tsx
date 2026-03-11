"use client";

import { useState, useEffect, Suspense } from "react";
import { Link } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface Division {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  minAge: number | null;
  maxAge: number | null;
}

function RegisterForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDivision = searchParams.get("division");
  const t = useTranslations("register");
  const divT = useTranslations("divisionContent");

  // Helper to get translated division content
  const getDivisionName = (slug: string, fallback: string) => {
    try {
      return divT(`${slug}.name`);
    } catch {
      return fallback;
    }
  };
  
  const getDivisionDescription = (slug: string, fallback: string | null) => {
    try {
      return divT(`${slug}.description`);
    } catch {
      return fallback;
    }
  };

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [competitorName, setCompetitorName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDivisions() {
      try {
        const res = await fetch("/api/divisions");
        const data = await res.json() as { divisions?: Division[] };
        setDivisions(data.divisions || []);
        
        if (preselectedDivision && data.divisions) {
          const div = data.divisions.find((d: Division) => d.slug === preselectedDivision);
          if (div) setSelectedDivision(div.id);
        }
      } catch (err) {
        console.error("Failed to fetch divisions", err);
      }
    }
    fetchDivisions();
  }, [preselectedDivision]);

  useEffect(() => {
    if (session?.user?.name) {
      setCompetitorName(session.user.name);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-3xl mb-4">{t("signInRequired")}</h1>
          <p className="text-muted mb-8">{t("signInMessage")}</p>
          <Link href="/login?callbackUrl=/register" className="btn-primary">
            {t("signIn")}
          </Link>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divisionId: selectedDivision,
          competitorName,
          dateOfBirth,
          emergencyContact,
          emergencyPhone,
        }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-8 border border-accent flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl mb-4">{t("success.title")}</h1>
          <p className="text-muted mb-10">
            {t("success.message")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setSelectedDivision("");
              }}
              className="btn-secondary"
            >
              {t("success.another")}
            </button>
            <Link href="/dashboard" className="btn-primary">
              {t("success.view")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pt-32 pb-20">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">{t("label")}</p>
          <h1 className="font-display text-3xl sm:text-4xl">{t("title")}</h1>
        </div>

        <div className="border border-subtle p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 border border-accent/50 text-accent text-sm">
                {error}
              </div>
            )}

            {/* Division Selection */}
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-muted mb-4">
                {t("form.division")}
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {divisions.map((division) => (
                  <label
                    key={division.id}
                    className={`p-4 cursor-pointer border transition-colors ${
                      selectedDivision === division.id
                        ? "border-accent"
                        : "border-subtle hover:border-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="division"
                      value={division.id}
                      checked={selectedDivision === division.id}
                      onChange={(e) => setSelectedDivision(e.target.value)}
                      className="sr-only"
                    />
                    <div className="font-display">
                      {getDivisionName(division.slug, division.name)}
                    </div>
                    {division.description && (
                      <div className="text-xs text-muted mt-1">
                        {getDivisionDescription(division.slug, division.description)}
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Competitor Name */}
            <div>
              <label htmlFor="competitorName" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                {t("form.competitorName")}
              </label>
              <input
                type="text"
                id="competitorName"
                value={competitorName}
                onChange={(e) => setCompetitorName(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
                placeholder={t("form.competitorNamePlaceholder")}
                required
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                {t("form.dateOfBirth")}
              </label>
              <input
                type="date"
                id="dateOfBirth"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
              />
              <p className="mt-1 text-xs text-faint">{t("form.dateOfBirthNote")}</p>
            </div>

            {/* Emergency Contact */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergencyContact" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                  {t("form.emergencyContact")}
                </label>
                <input
                  type="text"
                  id="emergencyContact"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label htmlFor="emergencyPhone" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                  {t("form.emergencyPhone")}
                </label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="p-4 bg-card text-xs text-muted">
              {t("form.terms")}
            </div>

            <button
              type="submit"
              disabled={loading || !selectedDivision || !competitorName}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? t("form.submitting") : t("form.submit")}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-faint text-sm">
          {t("alreadyRegistered")}{" "}
          <Link href="/dashboard" className="text-accent hover:text-cream transition-colors">
            {t("viewRegistrations")}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
