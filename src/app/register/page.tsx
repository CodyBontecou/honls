"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

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
          <h1 className="font-display text-3xl mb-4">Sign In Required</h1>
          <p className="text-muted mb-8">You need to sign in to register.</p>
          <Link href="/login?callbackUrl=/register" className="btn-primary">
            Sign In
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
          <h1 className="font-display text-3xl mb-4">You're Registered</h1>
          <p className="text-muted mb-10">
            See you at Honl's Beach, June 14–15, 2026.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setSelectedDivision("");
              }}
              className="btn-secondary"
            >
              Register Another
            </button>
            <Link href="/dashboard" className="btn-primary">
              View Registrations
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
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">Competition</p>
          <h1 className="font-display text-3xl sm:text-4xl">Registration</h1>
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
                Division *
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
                    <div className="font-display">{division.name}</div>
                    {division.description && (
                      <div className="text-xs text-muted mt-1">{division.description}</div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Competitor Name */}
            <div>
              <label htmlFor="competitorName" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                Competitor Name *
              </label>
              <input
                type="text"
                id="competitorName"
                value={competitorName}
                onChange={(e) => setCompetitorName(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
                placeholder="Full name"
                required
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-subtle focus:outline-none focus:border-accent transition-colors"
              />
              <p className="mt-1 text-xs text-faint">Required for age-restricted divisions</p>
            </div>

            {/* Emergency Contact */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergencyContact" className="block text-xs uppercase tracking-[0.15em] text-muted mb-2">
                  Emergency Contact
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
                  Emergency Phone
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
              By registering, you acknowledge that bodyboarding involves inherent risks. 
              Competitors under 18 must have a parent sign a waiver at check-in.
            </div>

            <button
              type="submit"
              disabled={loading || !selectedDivision || !competitorName}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Complete Registration"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-faint text-sm">
          Already registered?{" "}
          <Link href="/dashboard" className="text-accent hover:text-cream transition-colors">
            View registrations
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
