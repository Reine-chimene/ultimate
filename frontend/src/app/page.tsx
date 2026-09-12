import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Crown,
  Globe2,
  Heart,
  MessageCircle,
  Moon,
  Plane,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { LANDING_DEMO_PROFILES, TAGLINE, TAGLINE_SECONDARY, TAGLINE_TERTIARY } from "@/lib/constants";
import { WORLD_FLAGS } from "@/lib/countries";

const STEPS = [
  {
    step: "01",
    title: "Créez votre profil",
    desc: "Ville, pays, intentions — présentez-vous avec authenticité partout dans le monde.",
  },
  {
    step: "02",
    title: "Demandez à vous connecter",
    desc: "Découvrez des profils compatibles et envoyez une demande — pas de match instantané.",
  },
  {
    step: "03",
    title: "Rencontrez pour de vrai",
    desc: "Ce soir ou lors de vos déplacements — échangez et confirmez chaque rendez-vous.",
  },
];

const INTERNATIONAL_FEATURES = [
  { icon: Users, title: "Découverte locale", desc: "Rencontrez des personnes près de chez vous, dans votre ville et votre pays." },
  { icon: Globe2, title: "Découverte internationale", desc: "Explorez des profils au-delà des frontières, sans limites géographiques." },
  { icon: Moon, title: "Ce soir", desc: "Qui est disponible pour une rencontre aujourd'hui, où qu'ils soient." },
  { icon: Plane, title: "Mode Voyage", desc: "Planifiez un séjour et connectez-vous avec des personnes sur place." },
  { icon: Calendar, title: "Rencontres réelles", desc: "Proposez un rendez-vous et confirmez mutuellement chaque rencontre." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
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

      <section className="relative overflow-hidden px-4 py-16 md:px-8 md:py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#6b1d3a]/15 blur-[100px]" />
        <div className="relative mx-auto max-w-5xl text-center animate-fade-in">
          <Logo size="lg" />
          <p className="section-label mt-8">{TAGLINE}</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-7xl">
            {TAGLINE_SECONDARY}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-[#f5f0e8]/90 md:text-xl">
            {TAGLINE_TERTIARY}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#9a8f8a] md:text-lg">
            {TAGLINE_SECONDARY}
          </p>
          <p className="mt-6 text-2xl tracking-widest">{WORLD_FLAGS}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/inscription">
              <Button variant="gold" size="lg" className="w-full min-w-[220px] sm:w-auto">
                Créer mon profil <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/connexion">
              <Button variant="outline" size="lg" className="w-full min-w-[220px] sm:w-auto">
                Découvrir Ultimate
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-6xl">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 md:overflow-visible">
            {LANDING_DEMO_PROFILES.map((p) => (
              <div key={p.name} className="premium-card w-[220px] shrink-0 snap-center overflow-hidden md:w-auto">
                <div className="relative aspect-[3/4]">
                  <Image src={p.photo} alt={p.name} fill className="object-cover" sizes="220px" />
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

      <section className="border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="section-label text-center">Rencontrez au-delà des frontières</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold md:text-4xl">
            Local. International. Ce soir. En voyage.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INTERNATIONAL_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="premium-card p-8">
                <div className="inline-flex rounded-full bg-[#6b1d3a]/30 p-3 ring-1 ring-[#6b1d3a]/40">
                  <Icon className="h-7 w-7 text-[#c9a962]" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9a8f8a]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="section-label text-center">Comment ça marche</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold md:text-4xl">Trois étapes, une expérience fluide</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="premium-card p-8">
                <span className="font-display text-4xl font-bold text-[#6b1d3a]/60">{step}</span>
                <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9a8f8a]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-4 py-16 md:px-8 md:py-24">
        <div className="premium-card mx-auto max-w-4xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <Crown className="h-10 w-10 text-[#c9a962]" />
              <h2 className="mt-4 font-display text-3xl font-semibold">ULTIMATE Premium</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#9a8f8a]">
                Découverte internationale, Mode Voyage, filtres avancés et visibilité prioritaire.
              </p>
              <p className="mt-4 text-2xl font-semibold text-[#c9a962]">
                À partir de 19,99 $ <span className="text-sm font-normal text-[#9a8f8a]">CAD / mois</span>
              </p>
              <Link href="/premium" className="mt-6 inline-block">
                <Button variant="gold">Explorer Premium</Button>
              </Link>
            </div>
            <div className="relative min-h-[240px] bg-gradient-to-br from-[#6b1d3a]/30 to-[#1a1218] p-8 md:p-12">
              <ul className="space-y-3 text-sm">
                {["Découverte internationale", "Mode Voyage", "Voir qui vous a aimé", "Filtres « Ce soir » avancés"].map((f) => (
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

      <section className="border-t border-white/[0.06] px-4 py-16 md:px-8">
        <div className="premium-card mx-auto max-w-3xl p-8 text-center md:p-12">
          <Shield className="mx-auto h-10 w-10 text-[#c9a962]" />
          <h2 className="mt-4 font-display text-2xl font-semibold md:text-3xl">Confiance & sécurité</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#9a8f8a]">
            Signalement, blocage, consentement explicite pour chaque rendez-vous.
            Votre ville et pays sont visibles — jamais votre adresse exacte.
            Réservé aux personnes de 18 ans et plus.
          </p>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-4 py-16 text-center md:px-8 md:py-20">
        <MessageCircle className="mx-auto h-8 w-8 text-[#c9a962]" />
        <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">Prêt à rencontrer ?</h2>
        <p className="mt-2 text-[#9a8f8a]">Rejoignez ULTIMATE — local ou international.</p>
        <Link href="/inscription" className="mt-8 inline-block">
          <Button variant="primary" size="lg">Créer mon profil gratuitement</Button>
        </Link>
      </section>

      <footer className="border-t border-white/[0.06] px-4 py-8 text-center text-sm text-[#9a8f8a]">
        <div className="mb-4 flex justify-center gap-6">
          <Link href="/conditions" className="transition hover:text-[#f5f0e8]">Conditions</Link>
          <Link href="/confidentialite" className="transition hover:text-[#f5f0e8]">Confidentialité</Link>
        </div>
        <p>© 2026 ULTIMATE. Tous droits réservés. · {WORLD_FLAGS}</p>
      </footer>
    </div>
  );
}
