"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Crown, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { PREMIUM_PLANS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

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
    <div className="mx-auto max-w-md">
      <PageHeader
        eyebrow="Checkout"
        title="Confirmation"
        subtitle="Mode démo — aucun paiement réel ne sera effectué."
        centered
      />

      <div className="premium-card space-y-5 p-6 md:p-8">
        <div className="flex items-center justify-center gap-2 text-[#c9a962]">
          <Crown className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">Plan {plan.label}</span>
        </div>

        <div className="space-y-3 border-y border-white/[0.06] py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[#9a8f8a]">Abonnement</span>
            <span className="font-medium">{plan.price.toFixed(2)} $ CAD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9a8f8a]">Taxes</span>
            <span className="text-[#9a8f8a]">Incluses</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="text-[#c9a962]">{plan.price.toFixed(2)} $ CAD</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
          <div className="flex items-start gap-2">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="font-medium text-amber-200/90">Paiement simulé</p>
              <p className="mt-1 text-[#9a8f8a]">
                Ceci est une démonstration. Aucune carte bancaire n&apos;est requise et aucun montant ne sera débité.
              </p>
            </div>
          </div>
        </div>

        <Button variant="gold" className="w-full" loading={loading} onClick={handleCheckout}>
          Confirmer (simulation)
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => router.back()}>
          Retour aux plans
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-[#9a8f8a]">Chargement...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
