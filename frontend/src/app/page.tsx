import Link from "next/link";
import { ArrowRight, Heart, Moon, Shield, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { TAGLINE } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6 md:px-12">
        <Logo showTagline size="sm" />
        <div className="flex items-center gap-3">
          <Link href="/connexion" className="flex-1 sm:flex-none text-center text-sm text-[#9a8f8a] hover:text-[#f5f0e8] transition py-2">
            Connexion
          </Link>
          <Link href="/inscription" className="flex-1 sm:flex-none">
            <Button variant="gold" size="sm" className="w-full sm:w-auto">S&apos;inscrire</Button>
          </Link>
        </div>
      </header>

      <section className="relative px-6 py-20 md:px-12 md:py-32">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <div className="mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="mb-4 text-sm tracking-[0.4em] text-[#e8a0b4] uppercase">{TAGLINE}</p>
          <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl">
            Des rencontres <span className="text-gradient-gold">authentiques</span>
            <br />pour adultes exigeants
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9a8f8a]">
            Découvrez des personnes compatibles, échangez en toute confiance et
            transformez une connexion en rendez-vous — ce soir ou quand vous le souhaitez.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/inscription">
              <Button variant="gold" size="lg">
                Commencer gratuitement <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/connexion">
              <Button variant="outline" size="lg">J&apos;ai déjà un compte</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-6 py-20 md:px-12">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            { icon: Heart, title: "Matchs authentiques", desc: "Découvrez des profils compatibles et connectez-vous mutuellement." },
            { icon: Moon, title: "Disponible ce soir", desc: "Activez votre disponibilité et rencontrez des personnes libres aujourd'hui." },
            { icon: Shield, title: "Sécurité & consentement", desc: "Chaque rendez-vous nécessite une acceptation explicite des deux parties." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-8 text-center">
              <Icon className="mx-auto h-8 w-8 text-[#c9a962]" />
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-[#9a8f8a]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 px-6 py-16 text-center md:px-12">
        <Sparkles className="mx-auto h-8 w-8 text-[#c9a962]" />
        <h2 className="mt-4 font-display text-3xl font-bold">Prêt à rencontrer ?</h2>
        <p className="mt-2 text-[#9a8f8a]">Réservé aux personnes de 18 ans et plus.</p>
        <Link href="/inscription" className="mt-6 inline-block">
          <Button variant="primary" size="lg">Rejoindre ULTIMATE</Button>
        </Link>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-[#9a8f8a]">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/conditions" className="hover:text-[#f5f0e8]">Conditions</Link>
          <Link href="/confidentialite" className="hover:text-[#f5f0e8]">Confidentialité</Link>
        </div>
        <p>© 2026 ULTIMATE. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
