import { Link } from "@/i18n/routing";
import { getDatabase } from "@/lib/cloudflare";
import { registrations } from "@/db";
import { count, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";

async function getDivisionCounts() {
  try {
    const db = await getDatabase();
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

export default async function ContestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();
  const divisionsWithCounts = await getDivisionCounts();

  const getDivisionName = (slug: string, fallback: string) => {
    try {
      return t(`divisionContent.${slug}.name`);
    } catch {
      return fallback;
    }
  };

  const getDivisionDescription = (slug: string, fallback: string | null) => {
    try {
      return t(`divisionContent.${slug}.description`);
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
    <main className="min-h-screen">
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-sm text-muted hover:text-accent transition-colors">
            ← {t("contest.backHome")}
          </Link>

          <div className="mt-10 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">{t("contest.label")}</p>
            <h1 className="font-display text-4xl sm:text-6xl mb-4">{t("contest.title")}</h1>
            <p className="text-lg text-muted mb-4">{t("contest.subtitle")}</p>
            <p className="max-w-2xl mx-auto text-muted leading-relaxed">{t("contest.description")}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-12">
            <Link href="/register" className="border border-subtle p-5 hover:border-accent transition-colors">
              <p className="text-sm uppercase tracking-[0.12em] text-faint mb-2">01</p>
              <p className="font-display">{t("contest.quickLinks.register")}</p>
            </Link>
            <Link href="/standings" className="border border-subtle p-5 hover:border-accent transition-colors">
              <p className="text-sm uppercase tracking-[0.12em] text-faint mb-2">02</p>
              <p className="font-display">{t("contest.quickLinks.standings")}</p>
            </Link>
            <Link href="/dashboard" className="border border-subtle p-5 hover:border-accent transition-colors">
              <p className="text-sm uppercase tracking-[0.12em] text-faint mb-2">03</p>
              <p className="font-display">{t("contest.quickLinks.dashboard")}</p>
            </Link>
            <Link href="/login" className="border border-subtle p-5 hover:border-accent transition-colors">
              <p className="text-sm uppercase tracking-[0.12em] text-faint mb-2">04</p>
              <p className="font-display">{t("contest.quickLinks.login")}</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-subtle" id="contest-overview">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("contest.overview.label")}</p>
          <h2 className="font-display text-3xl sm:text-4xl mb-10">{t("contest.overview.title")}</h2>
          <div className="space-y-6 text-muted leading-relaxed">
            <p>{t("contest.overview.p1")}</p>
            <p>{t("contest.overview.p2")}</p>
          </div>
        </div>
      </section>

      <section id="contest-divisions" className="py-24 border-t border-subtle">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("contest.divisions.label")}</p>
            <h2 className="font-display text-3xl sm:text-4xl mb-4">{t("contest.divisions.title")}</h2>
            <p className="text-muted max-w-2xl mx-auto">{t("contest.divisions.description")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
            {divisionsWithCounts.length > 0 ? (
              divisionsWithCounts.map((division, index) => (
                <div key={division.id} className="bg-white p-8 flex flex-col">
                  <span className="text-xs text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-xl mt-2 mb-3">{getDivisionName(division.slug, division.name)}</h3>
                  <p className="text-muted text-sm mb-6">{getDivisionDescription(division.slug, division.description)}</p>

                  {(division.minAge || division.maxAge) && (
                    <p className="text-xs text-faint mb-4">
                      {t("divisions.ages", {
                        range:
                          division.minAge && division.maxAge
                            ? `${division.minAge}–${division.maxAge}`
                            : division.minAge
                              ? `${division.minAge}+`
                              : `< ${division.maxAge}`,
                      })}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-subtle mt-auto">
                    <span className="text-sm">
                      <span className="text-accent">{division.registeredCount}</span>
                      <span className="text-faint ml-1">{t("contest.divisions.registered")}</span>
                    </span>
                    <Link
                      href={`/register?division=${division.slug}`}
                      className="text-xs uppercase tracking-[0.15em] text-muted hover:text-cream transition-colors"
                    >
                      {t("contest.divisions.enter")}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              fallbackDivisions.map((division, index) => (
                <div key={division.slug} className="bg-white p-8 flex flex-col">
                  <span className="text-xs text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-xl mt-2 mb-3">{t(`divisionContent.${division.slug}.name`)}</h3>
                  <p className="text-muted text-sm mb-6">{t(`divisionContent.${division.slug}.description`)}</p>
                  <div className="pt-4 border-t border-subtle mt-auto">
                    <Link
                      href={`/register?division=${division.slug}`}
                      className="text-xs uppercase tracking-[0.15em] text-muted hover:text-cream transition-colors"
                    >
                      {t("contest.divisions.enter")}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section id="contest-schedule" className="py-24 border-t border-subtle">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("contest.schedule.label")}</p>
            <h2 className="font-display text-3xl sm:text-4xl">{t("contest.schedule.title")}</h2>
          </div>

          <div className="space-y-12">
            <div>
              <h3 className="font-display text-lg mb-6 pb-4 border-b border-subtle">{t("schedule.day1.title")}</h3>
              <div className="space-y-4">
                {(["checkin", "start", "break", "adult"] as const).map((key) => (
                  <div key={key} className="flex gap-6">
                    <span className="text-sm text-accent w-20 shrink-0">{t(`schedule.day1.items.${key}.time`)}</span>
                    <div>
                      <span>{t(`schedule.day1.items.${key}.title`)}</span>
                      {key === "start" && (
                        <span className="text-muted text-sm ml-2">— {t("schedule.day1.items.start.sub")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg mb-6 pb-4 border-b border-subtle">{t("schedule.day2.title")}</h3>
              <div className="space-y-4">
                {(["dropknee", "standup", "finals", "awards"] as const).map((key) => (
                  <div key={key} className="flex gap-6">
                    <span className="text-sm text-accent w-20 shrink-0">{t(`schedule.day2.items.${key}.time`)}</span>
                    <span>{t(`schedule.day2.items.${key}.title`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-faint text-xs mt-12">{t("contest.schedule.note")}</p>
        </div>
      </section>

      <section id="contest-partners" className="py-24 border-t border-subtle">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("contest.partners.label")}</p>
          <h2 className="font-display text-3xl sm:text-4xl mb-4">{t("contest.partners.title")}</h2>
          <p className="text-muted max-w-xl mx-auto mb-10">{t("contest.partners.subtitle")}</p>
          <a href="mailto:aloha@huilauloa.org?subject=Honls%20Contest%20Partnership" className="btn-primary">
            {t("contest.partners.button")}
          </a>
          <p className="text-xs text-faint mt-4">{t("contest.partners.email")}</p>
        </div>
      </section>

      <section className="py-24 border-t border-subtle">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl mb-6">{t("contest.cta.title")}</h2>
          <p className="text-muted mb-10">{t("contest.cta.description")}</p>
          <Link href="/register" className="btn-primary">
            {t("contest.cta.button")}
          </Link>
        </div>
      </section>
    </main>
  );
}
