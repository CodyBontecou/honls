import { Link } from "@/i18n/routing";
import { getDatabase } from "@/lib/cloudflare";
import { divisions, registrations } from "@/db";
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

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations();
  const divisionsWithCounts = await getDivisionCounts();

  // Helper to get translated division content
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
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center pt-24">
          <p className="text-sm uppercase tracking-[0.4em] text-muted mb-8">{t("hero.established")}</p>
          
          <h1 className="font-display mb-6">
            <span className="block text-5xl sm:text-7xl lg:text-8xl tracking-wide">{t("hero.title")}</span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl tracking-[0.2em] mt-4 text-accent">{t("hero.subtitle")}</span>
          </h1>
          
          <div className="w-16 h-px bg-accent mx-auto my-10" />
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-muted mb-12">
            <span>{t("hero.location")}</span>
            <span className="hidden sm:block">·</span>
            <span>{t("hero.date")}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/register" className="btn-primary">
              {t("hero.register")}
            </Link>
            <Link href="#divisions" className="btn-secondary">
              {t("hero.viewDivisions")}
            </Link>
          </div>

          <div className="flex justify-center gap-16 text-center">
            <div>
              <div className="font-display text-4xl text-accent">5</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mt-1">{t("hero.divisions")}</div>
            </div>
            <div>
              <div className="font-display text-4xl">{t("hero.free")}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mt-1">{t("hero.entry")}</div>
            </div>
            <div>
              <div className="font-display text-4xl text-accent">2</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mt-1">{t("hero.days")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-32 border-t border-subtle">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("about.label")}</p>
          
          <h2 className="font-display text-3xl sm:text-4xl mb-10">
            {t("about.title")}
          </h2>
          
          <div className="space-y-6 text-muted leading-relaxed">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
          </div>
        </div>
      </section>

      {/* Divisions */}
      <section id="divisions" className="py-32 border-t border-subtle">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("divisions.label")}</p>
            <h2 className="font-display text-3xl sm:text-4xl">{t("divisions.title")}</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
            {divisionsWithCounts.length > 0 ? (
              divisionsWithCounts.map((division, index) => (
                <div key={division.id} className="bg-white p-8 flex flex-col">
                  <span className="text-xs text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-xl mt-2 mb-3">
                    {getDivisionName(division.slug, division.name)}
                  </h3>
                  <p className="text-muted text-sm mb-6">
                    {getDivisionDescription(division.slug, division.description)}
                  </p>
                  
                  {(division.minAge || division.maxAge) && (
                    <p className="text-xs text-faint mb-4">
                      {t("divisions.ages", {
                        range: division.minAge && division.maxAge
                          ? `${division.minAge}–${division.maxAge}`
                          : division.minAge
                          ? `${division.minAge}+`
                          : `< ${division.maxAge}`
                      })}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-subtle mt-auto">
                    <span className="text-sm">
                      <span className="text-accent">{division.registeredCount}</span>
                      <span className="text-faint ml-1">{t("divisions.registered")}</span>
                    </span>
                    <Link
                      href={`/register?division=${division.slug}`}
                      className="text-xs uppercase tracking-[0.15em] text-muted hover:text-cream transition-colors"
                    >
                      {t("divisions.enter")}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              fallbackDivisions.map((division, index) => (
                <div key={division.slug} className="bg-white p-8 flex flex-col">
                  <span className="text-xs text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-xl mt-2 mb-3">
                    {t(`divisionContent.${division.slug}.name`)}
                  </h3>
                  <p className="text-muted text-sm mb-6">
                    {t(`divisionContent.${division.slug}.description`)}
                  </p>
                  <div className="pt-4 border-t border-subtle mt-auto">
                    <Link
                      href={`/register?division=${division.slug}`}
                      className="text-xs uppercase tracking-[0.15em] text-muted hover:text-cream transition-colors"
                    >
                      {t("divisions.enter")}
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
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("schedule.label")}</p>
            <h2 className="font-display text-3xl sm:text-4xl">{t("schedule.title")}</h2>
          </div>

          <div className="space-y-12">
            {/* Day 1 */}
            <div>
              <h3 className="font-display text-lg mb-6 pb-4 border-b border-subtle">
                {t("schedule.day1.title")}
              </h3>
              <div className="space-y-4">
                {(["checkin", "start", "break", "adult"] as const).map((key) => (
                  <div key={key} className="flex gap-6">
                    <span className="text-sm text-accent w-20 shrink-0">
                      {t(`schedule.day1.items.${key}.time`)}
                    </span>
                    <div>
                      <span>{t(`schedule.day1.items.${key}.title`)}</span>
                      {key === "start" && (
                        <span className="text-muted text-sm ml-2">
                          — {t("schedule.day1.items.start.sub")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day 2 */}
            <div>
              <h3 className="font-display text-lg mb-6 pb-4 border-b border-subtle">
                {t("schedule.day2.title")}
              </h3>
              <div className="space-y-4">
                {(["dropknee", "standup", "finals", "awards"] as const).map((key) => (
                  <div key={key} className="flex gap-6">
                    <span className="text-sm text-accent w-20 shrink-0">
                      {t(`schedule.day2.items.${key}.time`)}
                    </span>
                    <span>{t(`schedule.day2.items.${key}.title`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-faint text-xs mt-12">
            {t("schedule.note")}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-subtle">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl mb-6">
            {t("cta.title")}
          </h2>
          <p className="text-muted mb-10">
            {t("cta.description")}
          </p>
          <Link href="/register" className="btn-primary">
            {t("cta.button")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-subtle">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display tracking-wide">{t("footer.title")}</div>
          <div className="text-sm text-faint">{t("footer.copyright")}</div>
        </div>
      </footer>
    </main>
  );
}
