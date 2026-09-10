import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PremiumSuccessPage() {
  return (
    <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#c9a962]/20">
        <Check className="h-10 w-10 text-[#c9a962]" />
      </div>
      <Crown className="mx-auto h-8 w-8 text-[#c9a962] mt-6" />
      <h1 className="mt-4 font-display text-3xl font-bold text-gradient-gold">Bienvenue Premium !</h1>
      <p className="mt-2 text-[#9a8f8a]">Votre abonnement est maintenant actif. Profitez de tous les avantages.</p>
      <Link href="/decouvrir" className="mt-8 inline-block">
        <Button variant="gold">Commencer à explorer</Button>
      </Link>
    </div>
  );
}
