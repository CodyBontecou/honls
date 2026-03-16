import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";

const programKeys = ["community", "youth", "stewardship", "honlsClassic"] as const;
const eventKeys = ["spring", "summer", "fall", "winter"] as const;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center pt-24">
          <p className="text-sm uppercase tracking-[0.4em] text-muted mb-8">
            {t("hero.established")}
          </p>

          <h1 className="font-display mb-6">
            <span className="block text-5xl sm:text-7xl lg:text-8xl tracking-wide">
              {t("hero.title")}
            </span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl tracking-[0.08em] mt-4 text-accent">
              {t("hero.subtitle")}
            </span>
          </h1>

          <div className="w-16 h-px bg-accent mx-auto my-10" />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-muted mb-12">
            <span>{t("hero.location")}</span>
            <span className="hidden sm:block">·</span>
            <span>{t("hero.date")}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="#programs" className="btn-primary">
              {t("hero.register")}
            </Link>
            <Link href="#about" className="btn-secondary">
              {t("hero.viewDivisions")}
            </Link>
          </div>

          <div className="flex justify-center gap-16 text-center">
            <div>
              <div className="font-display text-4xl text-accent">4</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mt-1">
                {t("hero.divisions")}
              </div>
            </div>
            <div>
              <div className="font-display text-4xl">365</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mt-1">
                {t("hero.entry")}
              </div>
            </div>
            <div>
              <div className="font-display text-4xl text-accent">1</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted mt-1">
                {t("hero.days")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-32 border-t border-subtle">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("about.label")}</p>

          <h2 className="font-display text-3xl sm:text-4xl mb-10">{t("about.title")}</h2>

          <div className="space-y-6 text-muted leading-relaxed">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-32 border-t border-subtle">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("programs.label")}</p>
            <h2 className="font-display text-3xl sm:text-4xl mb-4">{t("programs.title")}</h2>
            <p className="text-muted max-w-2xl mx-auto">{t("programs.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-gray-200">
            {programKeys.map((program, index) => (
              <div key={program} className="bg-white p-8 flex flex-col">
                <span className="text-xs text-faint">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-xl mt-2 mb-3">{t(`programs.items.${program}.name`)}</h3>
                <p className="text-muted text-sm mb-6 leading-relaxed">
                  {t(`programs.items.${program}.description`)}
                </p>
                <div className="pt-4 border-t border-subtle mt-auto">
                  {program === "honlsClassic" ? (
                    <Link href="/contest" className="text-xs uppercase tracking-[0.15em] text-muted hover:text-cream transition-colors">
                      {t("programs.exploreContest")}
                    </Link>
                  ) : (
                    <a href="mailto:aloha@huilauloa.org" className="text-xs uppercase tracking-[0.15em] text-muted hover:text-cream transition-colors">
                      {t("programs.learnMore")}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="py-32 border-t border-subtle">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("events.label")}</p>
            <h2 className="font-display text-3xl sm:text-4xl mb-4">{t("events.title")}</h2>
            <p className="text-muted">{t("events.subtitle")}</p>
          </div>

          <div className="space-y-4">
            {eventKeys.map((event) => (
              <div key={event} className="bg-card p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                  <span className="text-sm text-accent sm:w-24 shrink-0 uppercase tracking-[0.1em]">
                    {t(`events.items.${event}.season`)}
                  </span>
                  <div>
                    <h3 className="font-display text-lg mb-2">{t(`events.items.${event}.title`)}</h3>
                    <p className="text-sm text-muted">{t(`events.items.${event}.description`)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-faint text-xs mt-12">{t("events.note")}</p>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="py-32 border-t border-subtle">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-6">{t("sponsors.label")}</p>
            <h2 className="font-display text-3xl sm:text-4xl mb-4">{t("sponsors.title")}</h2>
            <p className="text-muted max-w-xl mx-auto">{t("sponsors.subtitle")}</p>
          </div>

          <div className="mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-faint text-center mb-8">{t("sponsors.tiers.presenting")}</p>
            <div className="flex justify-center">
              <a
                href="mailto:aloha@huilauloa.org?subject=Community%20Partnership%20Inquiry"
                className="group border-2 border-dashed border-gray-300 hover:border-accent transition-colors duration-300 px-16 py-12 flex flex-col items-center justify-center"
              >
                <div className="text-4xl text-gray-300 group-hover:text-accent transition-colors mb-3">◇</div>
                <span className="text-lg font-display text-gray-400 group-hover:text-accent transition-colors">
                  {t("sponsors.placeholder.presenting")}
                </span>
                <span className="text-xs text-faint mt-2">{t("sponsors.placeholder.available")}</span>
              </a>
            </div>
          </div>

          <div className="bg-card p-8 sm:p-12 text-center">
            <h3 className="font-display text-xl sm:text-2xl mb-4">{t("sponsors.become.title")}</h3>
            <p className="text-muted text-sm max-w-lg mx-auto mb-8">{t("sponsors.become.description")}</p>
            <a href="mailto:aloha@huilauloa.org?subject=Partnership%20Inquiry" className="btn-primary">
              {t("sponsors.become.button")}
            </a>
            <p className="text-xs text-faint mt-4">{t("sponsors.become.email")}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-subtle">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl mb-6">{t("cta.title")}</h2>
          <p className="text-muted mb-10">{t("cta.description")}</p>
          <a href="mailto:aloha@huilauloa.org?subject=Getting%20Involved" className="btn-primary">
            {t("cta.button")}
          </a>
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
