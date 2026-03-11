import Link from "next/link";
import { getDatabase } from "@/lib/cloudflare";
import { divisions, registrations, rounds, heats, heatCompetitors } from "@/db";
import { count, eq, desc } from "drizzle-orm";

interface DivisionWithStats {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  competitorCount: number;
  currentRound: string | null;
  status: "upcoming" | "in_progress" | "completed";
  leader: string | null;
}

async function getDivisionsWithStandings(): Promise<DivisionWithStats[]> {
  try {
    const db = await getDatabase();
    
    const allDivisions = await db.query.divisions.findMany({
      orderBy: (divisions, { asc }) => [asc(divisions.sortOrder)],
    });

    const divisionsWithStats = await Promise.all(
      allDivisions.map(async (div) => {
        // Get competitor count
        const [countResult] = await db
          .select({ count: count() })
          .from(registrations)
          .where(eq(registrations.divisionId, div.id));

        // Get all rounds for this division
        const divisionRounds = await db.query.rounds.findMany({
          where: eq(rounds.divisionId, div.id),
          orderBy: desc(rounds.roundNumber),
        });

        // Determine overall status based on all rounds
        let status: "upcoming" | "in_progress" | "completed" = "upcoming";
        let currentRoundName: string | null = null;
        
        if (divisionRounds.length > 0) {
          const hasInProgress = divisionRounds.some(r => r.status === "in_progress");
          const hasCompleted = divisionRounds.some(r => r.status === "completed");
          const finalsRound = divisionRounds.find(r => r.name === "Finals");
          
          if (finalsRound?.status === "completed") {
            status = "completed";
            currentRoundName = "Finals";
          } else if (hasInProgress) {
            status = "in_progress";
            currentRoundName = divisionRounds.find(r => r.status === "in_progress")?.name || null;
          } else if (hasCompleted) {
            status = "in_progress";
            // Find the next upcoming round
            const nextRound = divisionRounds.filter(r => r.status === "upcoming").sort((a, b) => a.roundNumber - b.roundNumber)[0];
            currentRoundName = nextRound?.name || null;
          }
        }
        
        const latestRound = { name: currentRoundName };

        // Get leader (winner of finals or current top scorer)
        let leader: string | null = null;
        if (status === "completed" && latestRound) {
          const finalsHeat = await db.query.heats.findFirst({
            where: eq(heats.roundId, latestRound.id),
          });
          if (finalsHeat) {
            const winner = await db.query.heatCompetitors.findFirst({
              where: eq(heatCompetitors.heatId, finalsHeat.id),
              orderBy: desc(heatCompetitors.totalScore),
            });
            if (winner) {
              const reg = await db.query.registrations.findFirst({
                where: eq(registrations.id, winner.registrationId),
              });
              leader = reg?.competitorName || null;
            }
          }
        }

        return {
          id: div.id,
          name: div.name,
          slug: div.slug,
          description: div.description,
          competitorCount: countResult?.count || 0,
          currentRound: latestRound?.name || null,
          status,
          leader,
        };
      })
    );

    return divisionsWithStats;
  } catch {
    return [];
  }
}

export default async function StandingsPage() {
  const divisionsData = await getDivisionsWithStandings();

  return (
    <main className="min-h-screen px-4 pt-32 pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">Live</p>
          <h1 className="font-display text-4xl sm:text-5xl mb-4">Standings</h1>
          <p className="text-muted">Tournament brackets and results by division</p>
        </div>

        {/* Division Cards */}
        <div className="space-y-4">
          {divisionsData.length > 0 ? (
            divisionsData.map((division, index) => (
              <Link
                key={division.id}
                href={`/standings/${division.slug}`}
                className="block border border-subtle hover:border-accent transition-colors"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Division info */}
                    <div className="flex items-start gap-6">
                      <span className="text-xs text-faint font-mono">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h2 className="font-display text-xl mb-1">{division.name}</h2>
                        <p className="text-sm text-muted">{division.description}</p>
                      </div>
                    </div>

                    {/* Right: Status & Stats */}
                    <div className="flex items-center gap-8 sm:gap-12 pl-8 sm:pl-0">
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            division.status === "completed"
                              ? "bg-green-500"
                              : division.status === "in_progress"
                              ? "bg-accent animate-pulse"
                              : "bg-grey-300"
                          }`}
                        />
                        <span className="text-xs uppercase tracking-wider text-muted">
                          {division.status === "completed"
                            ? "Final"
                            : division.status === "in_progress"
                            ? division.currentRound || "Live"
                            : "Upcoming"}
                        </span>
                      </div>

                      {/* Competitor count */}
                      <div className="text-right">
                        <div className="text-lg font-display">
                          {division.competitorCount}
                        </div>
                        <div className="text-xs text-faint">competitors</div>
                      </div>

                      {/* Leader/Winner */}
                      {division.leader && (
                        <div className="text-right hidden sm:block">
                          <div className="text-sm text-accent">
                            {division.leader}
                          </div>
                          <div className="text-xs text-faint">
                            {division.status === "completed" ? "Winner" : "Leading"}
                          </div>
                        </div>
                      )}

                      {/* Arrow */}
                      <span className="text-faint">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            /* Fallback divisions */
            [
              { name: "Under 12", slug: "u12", desc: "Young groms 11 and under" },
              { name: "Under 18", slug: "u18", desc: "Junior division 12–17" },
              { name: "Adult Prone", slug: "adult", desc: "Open division 18+" },
              { name: "Drop Knee", slug: "dropknee", desc: "DK specialists" },
              { name: "Stand Up", slug: "standup", desc: "Full stand-up division" },
            ].map((division, index) => (
              <Link
                key={division.slug}
                href={`/standings/${division.slug}`}
                className="block border border-subtle hover:border-accent transition-colors"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-6">
                      <span className="text-xs text-faint font-mono">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h2 className="font-display text-xl mb-1">{division.name}</h2>
                        <p className="text-sm text-muted">{division.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 pl-8 sm:pl-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-grey-300" />
                        <span className="text-xs uppercase tracking-wider text-muted">
                          Upcoming
                        </span>
                      </div>
                      <span className="text-faint">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-grey-300" />
            <span>Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
        </div>
      </div>
    </main>
  );
}
