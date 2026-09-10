import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Logo />
        <h1 className="mt-8 font-display text-3xl font-bold">Conditions d&apos;utilisation</h1>
        <div className="mt-8 space-y-6 text-[#9a8f8a] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#f5f0e8]">1. Éligibilité</h2>
            <p className="mt-2">ULTIMATE est réservé aux personnes âgées de 18 ans et plus. En créant un compte, vous confirmez remplir cette condition.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#f5f0e8]">2. Comportement</h2>
            <p className="mt-2">Les utilisateurs s&apos;engagent à respecter les autres membres, à ne pas harceler, menacer ou publier du contenu illégal ou offensant.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#f5f0e8]">3. Rencontres</h2>
            <p className="mt-2">Un match ne constitue pas un consentement à une rencontre. Chaque rendez-vous doit être accepté explicitement par les deux parties.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#f5f0e8]">4. Abonnements</h2>
            <p className="mt-2">Les abonnements Premium sont facturés en dollars canadiens (CAD). Les conditions de remboursement seront précisées lors de l&apos;intégration des paiements.</p>
          </section>
        </div>
        <Link href="/" className="mt-8 inline-block text-[#c9a962] hover:underline">← Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
