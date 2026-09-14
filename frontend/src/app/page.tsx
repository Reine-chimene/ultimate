import Link from "next/link";
import {
  ArrowRight,
  Crown,
  Shield,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { AgeGate } from "@/components/landing/AgeGate";
import { MarketingImage } from "@/components/landing/MarketingImage";
import {
  LANDING_DEMO_PROFILES,
  LANDING_HERO_FALLBACK,
  LANDING_HERO_IMAGE,
  LANDING_PILLARS,
  LANDING_STEPS,
  LANDING_TESTIMONIALS,
  LANDING_TRUST,
  TAGLINE,
  TAGLINE_SECONDARY,
  TAGLINE_TERTIARY,
} from "@/lib/constants";
import { WORLD_FLAGS } from "@/lib/world-countries";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <AgeGate />
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <Logo showTagline size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/connexion" className="flex-1 py-2 text-center text-sm text-[#9a8f8a] transition hover:text-[#f5f0e8] sm:flex-none">
              Connexion
            </Link>
            <Link href="/inscription" className="flex-1 sm:flex-none">
              <Button variant="gold" size="sm" className="w-full sm:w-auto">
                Créer mon profil
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — style JALF, identité Ultimate */}
      <section className="relative min-h-[85vh] overflow-hidden">
        <MarketingImage
          src={LANDING_HERO_IMAGE}
          fallback={LANDING_HERO_FALLBACK}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/55 via-[#6b1d3a]/20 to-[#0a0a0b]/95" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center md:px-8 md:py-28">
          <Logo size="lg" />
          <p className="section-label mt-8">{TAGLINE}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            Rencontres adultes · corps · désirs · sans limite
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#f5f0e8]/90 md:text-xl">
            {TAGLINE_SECONDARY}
          </p>
          <p className="mt-3 text-base text-[#c9a962]">{TAGLINE_TERTIARY}</p>
          <p className="mt-6 text-2xl tracking-widest">{WORLD_FLAGS}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/inscription">
              <Button variant="gold" size="lg" className="w-full min-w-[220px] sm:w-auto">
                Inscription gratuite <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/connexion">
              <Button variant="outline" size="lg" className="w-full min-w-[220px] sm:w-auto">
                Connexion
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Profils demo — visuels propriétaires dans /public/marketing/ */}
      <section className="border-t border-white/[0.06] px-4 py-12 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="section-label text-center md:text-left">Ils·elles sont chaud·e·s ce soir</p>
          <h2 className="mt-2 text-center font-display text-2xl font-semibold md:text-left md:text-3xl">
            Filles, garçons, couples — prêts à jouer
          </h2>
          <div className="mt-8 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 md:overflow-visible">
            {LANDING_DEMO_PROFILES.map((p) => (
              <div key={p.name} className="premium-card w-[220px] shrink-0 snap-center overflow-hidden md:w-auto">
                <div className="relative aspect-[3/4]">
                  <MarketingImage src={p.photo} fallback={p.fallback} alt={p.name} fill className="object-cover" sizes="220px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 p-4">
                    <p className="font-display text-lg font-semibold">{p.name}, {p.age}</p>
                    <p className="text-xs text-[#9a8f8a]">{p.flag} {p.city}</p>
                    <p className="mt-1 text-[10px] text-[#c9a962]">{p.intention}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5+ piliers JALF */}
      <section className="border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="section-label text-center">Tout pour baiser, s&apos;exhiber et kiffer</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold md:text-4xl">
            Plus sauvage qu&apos;une app de dating — moins timide que tu crois
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {LANDING_PILLARS.map((pillar) => (
              <Link
                key={pillar.id}
                href={pillar.href}
                className="premium-card group overflow-hidden transition hover:ring-1 hover:ring-[#c9a962]/30"
              >
                <div className="relative aspect-[16/9]">
                  <MarketingImage
                    src={pillar.image}
                    fallback={pillar.fallback}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
                  <div className="absolute bottom-0 p-6">
                    <span className="text-xs font-medium uppercase tracking-wider text-[#c9a962]">
                      {pillar.subtitle}
                      {!pillar.live && " · Bientôt"}
                    </span>
                    <h3 className="mt-1 font-display text-2xl font-semibold">{pillar.title}</h3>
                  </div>
                </div>
                <p className="p-6 text-sm leading-relaxed text-[#9a8f8a]">{pillar.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="section-label text-center">Comment ça fonctionne</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold md:text-4xl">
            Trois étapes vers vos rencontres
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {LANDING_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="premium-card p-8 text-center md:text-left">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#6b1d3a]/40 font-display text-xl font-bold text-[#c9a962]">
                  {step}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9a8f8a]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confiance — grille 6 points JALF */}
      <section className="border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="section-label text-center">Discrétion & sécurité</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold md:text-4xl">
            Votre vie privée, notre priorité
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LANDING_TRUST.map(({ title, desc }) => (
              <div key={title} className="premium-card p-6">
                <Shield className="h-6 w-6 text-[#c9a962]" />
                <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-[#9a8f8a]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="section-label text-center">Ils·elles ont assumé leurs kinks</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold md:text-4xl">
            Crue, directe, sans tabou
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#9a8f8a]">
            Témoignages fictifs illustratifs — la confidentialité de nos membres est primordiale.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {LANDING_TESTIMONIALS.map(({ quote, author, age }) => (
              <blockquote key={author} className="premium-card p-8">
                <p className="text-sm italic leading-relaxed text-[#f5f0e8]/90">&ldquo;{quote}&rdquo;</p>
                <footer className="mt-4 text-sm font-medium text-[#c9a962]">
                  {author} · {age} ans
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Premium */}
      <section className="border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-24">
        <div className="premium-card mx-auto max-w-4xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <Crown className="h-10 w-10 text-[#c9a962]" />
              <h2 className="mt-4 font-display text-3xl font-semibold">Priorisez votre plaisir</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#9a8f8a]">
                Monde entier gratuit. Premium débloque le Voyage, l&apos;Incognito, les vidéos privées et VIP Gold.
              </p>
              <Link href="/premium" className="mt-6 inline-block">
                <Button variant="gold">Explorer Premium</Button>
              </Link>
            </div>
            <div className="relative min-h-[240px] bg-gradient-to-br from-[#6b1d3a]/30 to-[#1a1218] p-8 md:p-12">
              <ul className="space-y-3 text-sm">
                {["Monde entier gratuit", "Fil & profils couples", "Albums photos + vidéos", "VIP Gold — visibilité max"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#c9a962]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-white/[0.06] px-4 py-16 text-center md:px-8 md:py-20">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Entre. Assume. Jouis.</h2>
        <p className="mx-auto mt-3 max-w-lg text-[#9a8f8a]">
          18+ · Inscription gratuite · Monde entier · Le reste, c&apos;est entre adultes consentants.
        </p>
        <Link href="/inscription" className="mt-8 inline-block">
          <Button variant="primary" size="lg">Créer mon profil gratuitement</Button>
        </Link>
      </section>

      <footer className="border-t border-white/[0.06] px-4 py-8 text-center text-sm text-[#9a8f8a]">
        <div className="mb-4 flex justify-center gap-6">
          <Link href="/conditions" className="transition hover:text-[#f5f0e8]">Conditions</Link>
          <Link href="/confidentialite" className="transition hover:text-[#f5f0e8]">Confidentialité</Link>
        </div>
        <p>© 2026 ULTIMATE. Tous droits réservés. · 18+ · {WORLD_FLAGS}</p>
      </footer>
    </div>
  );
}
