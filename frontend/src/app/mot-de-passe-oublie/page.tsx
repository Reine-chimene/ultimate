import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="premium-card w-full max-w-md p-8 animate-slide-up md:p-10">
        <div className="text-center">
          <Logo />
          <h1 className="mt-6 font-display text-2xl font-semibold">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-[#9a8f8a]">
            Entrez votre courriel et nous vous enverrons un lien de réinitialisation.
          </p>
        </div>
        <form className="mt-8 space-y-4">
          <Input label="Courriel" type="email" required />
          <Button variant="gold" className="w-full" type="submit">
            Envoyer le lien
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#9a8f8a]">
          <Link href="/connexion" className="text-[#c9a962] hover:underline">Retour à la connexion</Link>
        </p>
        <p className="mt-4 rounded-lg bg-white/[0.03] px-3 py-2 text-center text-xs text-[#9a8f8a]/70">
          Fonctionnalité simulée pour le MVP — aucun courriel ne sera envoyé.
        </p>
      </div>
    </div>
  );
}
