import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PremiumSuccessPage() {
  return (
    <div className="mx-auto max-w-md py-8 text-center animate-fade-in md:py-12">
      <div className="premium-card p-8 md:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#c9a962]/15 ring-2 ring-[#c9a962]/30">
          <Check className="h-10 w-10 text-[#c9a962]" />
        </div>
        <Crown className="mx-auto mt-6 h-8 w-8 text-[#c9a962]" />
        <h1 className="mt-4 font-display text-3xl font-bold text-gradient-gold">Premium activé</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#9a8f8a]">
          Votre abonnement a été activé en mode simulation.
          Profitez des avantages Premium dans l&apos;application.
        </p>
        <p className="mt-2 text-xs text-[#9a8f8a]/60">
          Aucun paiement réel n&apos;a été traité.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/decouvrir">
            <Button variant="gold" className="w-full">Commencer à explorer</Button>
          </Link>
          <Link href="/premium">
            <Button variant="ghost" className="w-full">Retour à Premium</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
