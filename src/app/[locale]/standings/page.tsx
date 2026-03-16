import { Link } from "@/i18n/routing";
import { getDatabase } from "@/lib/cloudflare";
import { divisions, registrations, rounds, heats, heatCompetitors } from "@/db";
import { count, eq, desc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
            const nextRound = divisionRounds.filter(r => r.status === "upcoming").sort((a, b) => a.roundNumber - b.roundNumber)[0];
            currentRoundName = nextRound?.name || null;
          }
        }
        
        // Get leader (winner of finals or current top scorer)
        let leader: string | null = null;
        if (status === "completed") {
          const finalsRoundObj = divisionRounds.find(r => r.name === "Finals");
          const finalsHeat = finalsRoundObj ? await db.query.heats.findFirst({
            where: eq(heats.roundId, finalsRoundObj.id),
          }) : null;
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
          currentRound: currentRoundName,
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

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations("standings");
  const divT = await getTranslations("divisionContent");
  const divisionsData = await getDivisionsWithStandings();

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

  const fallbackDivisions = [
    { slug: "u12" },
    { slug: "u18" },
    { slug: "adult" },
    { slug: "dropknee" },
    { slug: "standup" },
  ];

  return (
    <main className="min-h-screen px-4 pt-32 pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">{t("label")}</p>
          <h1 className="font-display text-4xl sm:text-5xl mb-4">{t("title")}</h1>
          <p className="text-muted">{t("subtitle")}</p>
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
                        <h2 className="font-display text-xl mb-1">
                          {getDivisionName(division.slug, division.name)}
                        </h2>
                        <p className="text-sm text-muted">
                          {getDivisionDescription(division.slug, division.description)}
                        </p>
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
                            ? t("status.final")
                            : division.status === "in_progress"
                            ? division.currentRound || t("status.live")
                            : t("status.upcoming")}
                        </span>
                      </div>

                      {/* Competitor count */}
                      <div className="text-right">
                        <div className="text-lg font-display">
                          {division.competitorCount}
                        </div>
                        <div className="text-xs text-faint">{t("competitors")}</div>
                      </div>

                      {/* Leader/Winner */}
                      {division.leader && (
                        <div className="text-right hidden sm:block">
                          <div className="text-sm text-accent">
                            {division.leader}
                          </div>
                          <div className="text-xs text-faint">
                            {division.status === "completed" ? t("winner") : t("leading")}
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
            fallbackDivisions.map((division, index) => (
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
                        <h2 className="font-display text-xl mb-1">
                          {divT(`${division.slug}.name`)}
                        </h2>
                        <p className="text-sm text-muted">
                          {divT(`${division.slug}.description`)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 pl-8 sm:pl-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-grey-300" />
                        <span className="text-xs uppercase tracking-wider text-muted">
                          {t("status.upcoming")}
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
            <span>{t("legend.upcoming")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>{t("legend.inProgress")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>{t("legend.completed")}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
