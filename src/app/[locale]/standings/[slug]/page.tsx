import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getDatabase } from "@/lib/cloudflare";
import { divisions, registrations, rounds, heats, heatCompetitors } from "@/db";
import { eq, asc, desc } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface HeatCompetitorData {
  id: string;
  competitorName: string;
  wave1Score: number | null;
  wave2Score: number | null;
  wave3Score: number | null;
  totalScore: number | null;
  placement: number | null;
  advanced: boolean;
}

interface HeatData {
  id: string;
  heatNumber: number;
  status: string;
  scheduledTime: string | null;
  competitors: HeatCompetitorData[];
}

interface RoundData {
  id: string;
  name: string;
  roundNumber: number;
  status: string;
  heats: HeatData[];
}

interface DivisionStandings {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  rounds: RoundData[];
  allCompetitors: { id: string; name: string; seed: number | null }[];
}

async function getDivisionStandings(slug: string): Promise<DivisionStandings | null> {
  try {
    const db = await getDatabase();

    // Get division
    const division = await db.query.divisions.findFirst({
      where: eq(divisions.slug, slug),
    });

    if (!division) return null;

    // Get competitors (safe fallback)
    let competitors: Awaited<ReturnType<typeof db.query.registrations.findMany>> = [];
    try {
      competitors = await db.query.registrations.findMany({
        where: eq(registrations.divisionId, division.id),
        orderBy: asc(registrations.seedNumber),
      });
    } catch {
      // Keep empty competitor list
    }

    // Get rounds (safe fallback for environments without tournament tables)
    let divisionRounds: Awaited<ReturnType<typeof db.query.rounds.findMany>> = [];
    try {
      divisionRounds = await db.query.rounds.findMany({
        where: eq(rounds.divisionId, division.id),
        orderBy: asc(rounds.roundNumber),
      });
    } catch {
      // Keep empty rounds list
    }

    // Build complete round data with heats and competitors
    const roundsData: RoundData[] = await Promise.all(
      divisionRounds.map(async (round) => {
        let roundHeats: Awaited<ReturnType<typeof db.query.heats.findMany>> = [];
        try {
          roundHeats = await db.query.heats.findMany({
            where: eq(heats.roundId, round.id),
            orderBy: asc(heats.heatNumber),
          });
        } catch {
          // Keep empty heats list
        }

        const heatsData: HeatData[] = await Promise.all(
          roundHeats.map(async (heat) => {
            let heatComps: Awaited<ReturnType<typeof db.query.heatCompetitors.findMany>> = [];
            try {
              heatComps = await db.query.heatCompetitors.findMany({
                where: eq(heatCompetitors.heatId, heat.id),
                orderBy: [desc(heatCompetitors.totalScore), asc(heatCompetitors.placement)],
              });
            } catch {
              // Keep empty competitors list
            }

            const competitorsData: HeatCompetitorData[] = await Promise.all(
              heatComps.map(async (hc) => {
                let competitorName = "Unknown";
                try {
                  const reg = await db.query.registrations.findFirst({
                    where: eq(registrations.id, hc.registrationId),
                  });
                  competitorName = reg?.competitorName || "Unknown";
                } catch {
                  // Keep fallback name
                }

                return {
                  id: hc.id,
                  competitorName,
                  wave1Score: hc.wave1Score,
                  wave2Score: hc.wave2Score,
                  wave3Score: hc.wave3Score,
                  totalScore: hc.totalScore,
                  placement: hc.placement,
                  advanced: hc.advanced ?? false,
                };
              })
            );

            return {
              id: heat.id,
              heatNumber: heat.heatNumber,
              status: heat.status || "upcoming",
              scheduledTime: heat.scheduledTime,
              competitors: competitorsData,
            };
          })
        );

        return {
          id: round.id,
          name: round.name,
          roundNumber: round.roundNumber,
          status: round.status || "upcoming",
          heats: heatsData,
        };
      })
    );

    return {
      id: division.id,
      name: division.name,
      slug: division.slug,
      description: division.description,
      rounds: roundsData,
      allCompetitors: competitors.map((c) => ({
        id: c.id,
        name: c.competitorName,
        seed: c.seedNumber,
      })),
    };
  } catch {
    return null;
  }
}

function formatScore(score: number | null): string {
  if (score === null) return "—";
  return (score / 100).toFixed(2);
}

export default async function DivisionStandingsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations();
  const standings = await getDivisionStandings(slug);

  if (!standings) {
    notFound();
  }

  // Get translated division name/description
  const getDivisionName = () => {
    try {
      return t(`divisionContent.${slug}.name`);
    } catch {
      return standings.name;
    }
  };
  
  const getDivisionDescription = () => {
    try {
      return t(`divisionContent.${slug}.description`);
    } catch {
      return standings.description;
    }
  };

  const hasStarted = standings.rounds.length > 0;

  return (
    <main className="min-h-screen px-4 pt-32 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/standings"
            className="text-sm text-muted hover:text-accent transition-colors"
          >
            ← {t("standings.title")}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">
            {t("standings.label")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl mb-3">
            {getDivisionName()}
          </h1>
          {standings.description && (
            <p className="text-muted">{getDivisionDescription()}</p>
          )}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <span className="text-faint">
              {standings.allCompetitors.length} {t("standings.competitors")}
            </span>
            {standings.rounds.length > 0 && (
              <span className="text-faint">
                {standings.rounds.length} rounds
              </span>
            )}
          </div>
        </div>

        {hasStarted ? (
          /* Tournament Bracket View */
          <div className="space-y-12">
            {standings.rounds.map((round) => (
              <section key={round.id}>
                {/* Round Header */}
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-display text-xl">{round.name}</h2>
                  <span
                    className={`text-xs px-2 py-1 uppercase tracking-wider ${
                      round.status === "completed"
                        ? "bg-green-500/10 text-green-600"
                        : round.status === "in_progress"
                        ? "bg-accent/10 text-accent"
                        : "bg-grey-100 text-muted"
                    }`}
                  >
                    {round.status === "in_progress" ? t("standings.status.live") : round.status}
                  </span>
                </div>

                {/* Heats Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {round.heats.map((heat) => (
                    <div key={heat.id} className="border border-subtle">
                      {/* Heat Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-grey-100 border-b border-subtle">
                        <span className="text-sm font-medium">
                          Heat {heat.heatNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          {heat.scheduledTime && (
                            <span className="text-xs text-faint">
                              {heat.scheduledTime}
                            </span>
                          )}
                          {heat.status === "in_progress" && (
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          )}
                        </div>
                      </div>

                      {/* Competitors */}
                      <div className="divide-y divide-subtle">
                        {heat.competitors.length > 0 ? (
                          heat.competitors.map((comp, idx) => (
                            <div
                              key={comp.id}
                              className={`px-4 py-3 flex items-center gap-4 ${
                                comp.advanced ? "bg-accent/5" : ""
                              }`}
                            >
                              {/* Placement */}
                              <span
                                className={`w-6 h-6 flex items-center justify-center text-xs font-mono ${
                                  comp.placement === 1
                                    ? "bg-accent text-white"
                                    : comp.placement === 2
                                    ? "bg-grey-200 text-cream"
                                    : "text-faint"
                                }`}
                              >
                                {comp.placement || idx + 1}
                              </span>

                              {/* Name */}
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`truncate ${
                                    comp.advanced ? "text-accent font-medium" : ""
                                  }`}
                                >
                                  {comp.competitorName}
                                </span>
                                {comp.advanced && (
                                  <span className="ml-2 text-xs text-accent">
                                    ADV
                                  </span>
                                )}
                              </div>

                              {/* Wave Scores */}
                              {(comp.wave1Score !== null ||
                                comp.wave2Score !== null ||
                                comp.wave3Score !== null) && (
                                <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
                                  <span>{formatScore(comp.wave1Score)}</span>
                                  <span>{formatScore(comp.wave2Score)}</span>
                                  {comp.wave3Score !== null && (
                                    <span>{formatScore(comp.wave3Score)}</span>
                                  )}
                                </div>
                              )}

                              {/* Total Score */}
                              <div className="text-right">
                                <span
                                  className={`font-mono ${
                                    comp.placement === 1
                                      ? "text-accent font-medium"
                                      : ""
                                  }`}
                                >
                                  {formatScore(comp.totalScore)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-faint text-sm">
                            TBD
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* Pre-tournament: Show registered competitors */
          <div>
            <div className="border border-subtle mb-8">
              <div className="px-4 py-3 bg-grey-100 border-b border-subtle">
                <h2 className="font-display">Registered {t("standings.competitors")}</h2>
              </div>
              <div className="divide-y divide-subtle">
                {standings.allCompetitors.length > 0 ? (
                  standings.allCompetitors.map((comp, idx) => (
                    <div key={comp.id} className="px-4 py-3 flex items-center gap-4">
                      <span className="w-6 h-6 flex items-center justify-center text-xs font-mono text-faint bg-grey-100">
                        {comp.seed || idx + 1}
                      </span>
                      <span>{comp.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-12 text-center text-faint">
                    No {t("standings.competitors")} registered yet
                  </div>
                )}
              </div>
            </div>

            <div className="text-center border border-dashed border-subtle p-12">
              <p className="text-muted mb-4">
                Tournament bracket will appear once competition begins
              </p>
              <p className="text-xs text-faint">
                Heats and rounds are generated based on registration count
              </p>
            </div>
          </div>
        )}

        {/* Scoring Info */}
        <div className="mt-16 border-t border-subtle pt-8">
          <h3 className="font-display text-sm mb-4">Scoring</h3>
          <div className="grid sm:grid-cols-3 gap-6 text-sm text-muted">
            <div>
              <span className="text-faint block mb-1">Wave Score</span>
              0.00 – 10.00 points per wave
            </div>
            <div>
              <span className="text-faint block mb-1">Total</span>
              Best 2 of 3 waves combined
            </div>
            <div>
              <span className="text-faint block mb-1">Advancement</span>
              Top 2 from each heat advance
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
