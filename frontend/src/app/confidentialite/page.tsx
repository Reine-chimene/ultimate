import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Logo />
        <h1 className="mt-8 font-display text-3xl font-bold">Politique de confidentialité</h1>
        <div className="mt-8 space-y-6 text-[#9a8f8a] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#f5f0e8]">Données collectées</h2>
            <p className="mt-2">Nous collectons les informations que vous fournissez lors de l&apos;inscription et de la création de votre profil : prénom, courriel, date de naissance, ville, photos et préférences.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#f5f0e8]">Localisation</h2>
            <p className="mt-2">Votre localisation exacte n&apos;est jamais partagée. Seule votre ville ou une distance approximative est visible par les autres utilisateurs.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#f5f0e8]">Contact privé</h2>
            <p className="mt-2">Vos coordonnées personnelles (courriel, téléphone) ne sont jamais exposées automatiquement aux autres utilisateurs.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#f5f0e8]">Vos droits</h2>
            <p className="mt-2">Vous pouvez modifier ou supprimer votre compte à tout moment depuis les paramètres de votre profil.</p>
          </section>
        </div>
        <Link href="/" className="mt-8 inline-block text-[#c9a962] hover:underline">← Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
