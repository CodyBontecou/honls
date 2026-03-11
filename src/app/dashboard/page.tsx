"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Registration {
  id: string;
  competitorName: string;
  divisionId: string;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  createdAt: string;
  status: string;
}

interface Division {
  id: string;
  name: string;
  slug: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [regRes, divRes] = await Promise.all([
          fetch("/api/register"),
          fetch("/api/divisions"),
        ]);

        const regData = await regRes.json() as { registrations?: Registration[] };
        const divData = await divRes.json() as { divisions?: Division[] };

        setRegistrations(regData.registrations || []);
        setDivisions(divData.divisions || []);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const getDivisionName = (divisionId: string) => {
    const div = divisions.find((d) => d.id === divisionId);
    return div?.name || "Unknown";
  };

  const handleWithdraw = async (registrationId: string) => {
    if (!confirm("Withdraw from this division?")) return;

    setDeleting(registrationId);
    try {
      const res = await fetch("/api/register", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });
      if (res.ok) {
        setRegistrations((prev) => prev.filter((r) => r.id !== registrationId));
      }
    } catch (err) {
      console.error("Failed to withdraw", err);
    } finally {
      setDeleting(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-4">Sign In Required</h1>
          <p className="text-muted mb-8">Sign in to view your dashboard.</p>
          <Link href="/login?callbackUrl=/dashboard" className="btn-primary">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pt-32 pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Dashboard</p>
            <h1 className="font-display text-3xl">
              {session?.user?.name || "Competitor"}
            </h1>
          </div>
          <Link href="/register" className="btn-primary text-sm">
            + Register
          </Link>
        </div>

        {registrations.length === 0 ? (
          <div className="border border-subtle p-12 text-center">
            <h2 className="font-display text-xl mb-3">No Registrations</h2>
            <p className="text-muted mb-8">You haven't registered for any divisions.</p>
            <Link href="/register" className="btn-primary">
              Register Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted mb-6">
              Your registrations ({registrations.length})
            </p>

            {registrations.map((reg) => (
              <div key={reg.id} className="border border-subtle p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-lg">{getDivisionName(reg.divisionId)}</h3>
                      <span className={`text-xs px-2 py-0.5 ${
                        reg.status === "confirmed" ? "text-accent border border-accent" : "text-muted border border-subtle"
                      }`}>
                        {reg.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted space-y-1">
                      <p>Name: {reg.competitorName}</p>
                      {reg.dateOfBirth && <p>DOB: {reg.dateOfBirth}</p>}
                      <p>Registered: {new Date(reg.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWithdraw(reg.id)}
                    disabled={deleting === reg.id}
                    className="text-sm text-muted hover:text-accent transition-colors"
                  >
                    {deleting === reg.id ? "..." : "Withdraw"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 border border-subtle p-6">
          <h3 className="font-display mb-4">Event Info</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted">Date:</span>
              <p>June 14–15, 2026</p>
            </div>
            <div>
              <span className="text-muted">Location:</span>
              <p>Honl's Beach, Kailua-Kona</p>
            </div>
            <div>
              <span className="text-muted">Check-in:</span>
              <p>6:30 AM each day</p>
            </div>
            <div>
              <span className="text-muted">Contact:</span>
              <p className="text-accent">info@honlsclassic.com</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
