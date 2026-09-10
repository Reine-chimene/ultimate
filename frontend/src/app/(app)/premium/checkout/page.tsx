"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Crown } from "lucide-react";
import { api } from "@/lib/api";
import { PREMIUM_PLANS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

function CheckoutForm() {
  const router = useRouter();
  const params = useSearchParams();
  const durationMonths = Number(params.get("plan") ?? "1");
  const plan = PREMIUM_PLANS.find((p) => p.durationMonths === durationMonths) ?? PREMIUM_PLANS[0];
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await api.subscriptions.subscribe(plan.durationMonths);
      router.push("/premium/success");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <Crown className="mx-auto h-10 w-10 text-[#c9a962]" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Paiement</h1>
        <p className="text-sm text-[#9a8f8a]">Simulation de paiement — aucun frais réel</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex justify-between py-3 border-b border-white/5">
          <span>Plan {plan.label}</span>
          <span className="font-semibold text-[#c9a962]">{plan.price.toFixed(2)} CAD</span>
        </div>
        <div className="flex justify-between py-3 border-b border-white/5">
          <span>Taxes</span>
          <span className="text-[#9a8f8a]">Incluses</span>
        </div>
        <div className="flex justify-between py-3 font-semibold">
          <span>Total</span>
          <span className="text-[#c9a962]">{plan.price.toFixed(2)} CAD</span>
        </div>

        <div className="rounded-xl bg-white/5 p-4 text-sm text-[#9a8f8a]">
          <p>💳 Mode simulation</p>
          <p className="mt-1">Le paiement réel sera intégré ultérieurement via un processeur sécurisé.</p>
        </div>

        <Button variant="gold" className="w-full" loading={loading} onClick={handleCheckout}>
          Confirmer le paiement
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Chargement...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
