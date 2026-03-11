import Link from "next/link";
import { db, divisions, registrations } from "@/db";
import { count, eq } from "drizzle-orm";

async function getDivisionCounts() {
  try {
    const allDivisions = await db.query.divisions.findMany({
      orderBy: (divisions, { asc }) => [asc(divisions.sortOrder)],
    });

    const divisionCounts = await Promise.all(
      allDivisions.map(async (div) => {
        const [result] = await db
          .select({ count: count() })
          .from(registrations)
          .where(eq(registrations.divisionId, div.id));
        return { ...div, registeredCount: result?.count || 0 };
      })
    );

    return divisionCounts;
  } catch {
    return [];
  }
}

export default async function Home() {
  const divisionsWithCounts = await getDivisionCounts();

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center pt-24">
          <p className="text-sm uppercase tracking-[0.4em] text-muted mb-8">Est. 2026</p>
          
          <h1 className="font-display mb-6">
            <span className="block text-5xl sm:text-7xl lg:text-8xl tracking-wide">Honl's Beach</span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl tracking-[0.2em] mt-4 text-accent">Bodyboarding Classic</span>
          </h1>
          
          <div className="w-16 h-px bg-accent mx-auto my-10" />
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-muted mb-12">
            <span>Kailua-Kona, Hawai'i</span>
            <span className="hidden sm:block">·</span>
            <span>June 14–15, 2026</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/register" className="btn-primary">
              Register
            </Link>
            <Link href="#divisions" className="btn-secondary">
              View Divisions
            </Link>
          </div>

          <div className="flex justify-center gap-16 text-center">
            <div>
              <div className="font-display text-4xl text-accent">5</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mt-1">Divisions</div>
            </div>
            <div>
              <div className="font-display text-4xl">Free</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mt-1">Entry</div>
            </div>
            <div>
              <div className="font-display text-4xl text-accent">2</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mt-1">Days</div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-32 border-t border-subtle">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">About</p>
          
          <h2 className="font-display text-3xl sm:text-4xl mb-10">
            The Spirit of Hawaiian Waters
          </h2>
          
          <div className="space-y-6 text-muted leading-relaxed">
            <p>
              Where the black lava meets the turquoise sea, Honl's Beach has long been a 
              gathering place for riders who understand the ocean's ancient rhythms. 
              Here, the shore break creates perfect conditions for the art of bodyboarding—
              a tradition born in these very waters.
            </p>
            <p>
              This competition honors the spirit of Hawaiian watermanship, welcoming riders 
              of all ages and abilities to test their skills against the waves 
              of the Kona coast.
            </p>
          </div>
        </div>
      </section>

      {/* Divisions */}
      <section id="divisions" className="py-32 border-t border-subtle">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">Competition</p>
            <h2 className="font-display text-3xl sm:text-4xl">Divisions</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
            {divisionsWithCounts.length > 0 ? (
              divisionsWithCounts.map((division, index) => (
                <div key={division.id} className="bg-white p-8">
                  <span className="text-xs text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-xl mt-2 mb-3">{division.name}</h3>
                  <p className="text-muted text-sm mb-6">{division.description}</p>
                  
                  {(division.minAge || division.maxAge) && (
                    <p className="text-xs text-faint mb-4">
                      Ages: {division.minAge && division.maxAge
                        ? `${division.minAge}–${division.maxAge}`
                        : division.minAge
                        ? `${division.minAge}+`
                        : `Under ${division.maxAge}`}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-subtle">
                    <span className="text-sm">
                      <span className="text-accent">{division.registeredCount}</span>
                      <span className="text-faint ml-1">registered</span>
                    </span>
                    <Link
                      href={`/register?division=${division.slug}`}
                      className="text-xs uppercase tracking-[0.15em] text-muted hover:text-cream transition-colors"
                    >
                      Enter →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              [
                { name: "Under 12", slug: "u12", desc: "Young groms 11 years and under" },
                { name: "Under 18", slug: "u18", desc: "Junior division for competitors 12–17" },
                { name: "Adult Prone", slug: "adult", desc: "Open division for all adults 18+" },
                { name: "Drop Knee", slug: "dropknee", desc: "DK specialists riding with one knee up" },
                { name: "Stand Up", slug: "standup", desc: "Full stand-up bodyboarding division" },
              ].map((division, index) => (
                <div key={division.slug} className="bg-white p-8">
                  <span className="text-xs text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-xl mt-2 mb-3">{division.name}</h3>
                  <p className="text-muted text-sm mb-6">{division.desc}</p>
                  <div className="pt-4 border-t border-subtle">
                    <Link
                      href={`/register?division=${division.slug}`}
                      className="text-xs uppercase tracking-[0.15em] text-muted hover:text-cream transition-colors"
                    >
                      Enter →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section id="schedule" className="py-32 border-t border-subtle">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">Event</p>
            <h2 className="font-display text-3xl sm:text-4xl">Schedule</h2>
          </div>

          <div className="space-y-12">
            {/* Day 1 */}
            <div>
              <h3 className="font-display text-lg mb-6 pb-4 border-b border-subtle">
                Saturday, June 14
              </h3>
              <div className="space-y-4">
                {[
                  { time: "6:30 AM", title: "Check-in Opens" },
                  { time: "7:00 AM", title: "Competition Begins", sub: "Under 12 & Under 18 rounds" },
                  { time: "12:00 PM", title: "Break" },
                  { time: "1:00 PM", title: "Adult Division Rounds" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-sm text-accent w-20 shrink-0">{item.time}</span>
                    <div>
                      <span>{item.title}</span>
                      {item.sub && <span className="text-muted text-sm ml-2">— {item.sub}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day 2 */}
            <div>
              <h3 className="font-display text-lg mb-6 pb-4 border-b border-subtle">
                Sunday, June 15
              </h3>
              <div className="space-y-4">
                {[
                  { time: "7:00 AM", title: "Drop Knee Division" },
                  { time: "10:00 AM", title: "Stand Up Division" },
                  { time: "2:00 PM", title: "Finals" },
                  { time: "5:00 PM", title: "Awards Ceremony" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-sm text-accent w-20 shrink-0">{item.time}</span>
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-faint text-xs mt-12">
            Schedule subject to change based on conditions
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-subtle">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl mb-6">
            Ready to Ride?
          </h2>
          <p className="text-muted mb-10">
            Registration is free and open to all skill levels.
          </p>
          <Link href="/register" className="btn-primary">
            Register Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-subtle">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display tracking-wide">Honl's Beach Classic</div>
          <div className="text-sm text-faint">© 2026</div>
        </div>
      </footer>
    </main>
  );
}
