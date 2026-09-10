"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { api } from "@/lib/api";
import type { Subscription } from "@/types";
import { PREMIUM_FEATURES, PREMIUM_PLANS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default function PremiumPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    api.subscriptions.me().then(setSubscription).catch(() => setSubscription(null));
  }, []);

  const isActive = subscription?.status === "active" && subscription.plan !== "free";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <Crown className="mx-auto h-12 w-12 text-[#c9a962]" />
        <h1 className="mt-4 font-display text-4xl font-bold text-gradient-gold">ULTIMATE Premium</h1>
        <p className="mt-2 text-[#9a8f8a]">Élevez votre expérience de rencontre</p>
      </div>

      {isActive && subscription && (
        <div className="glass-card p-6 mb-8 text-center border border-[#c9a962]/30">
          <p className="text-[#c9a962] font-medium">Abonnement actif</p>
          <p className="text-sm text-[#9a8f8a] mt-1">
            Expire le {subscription.expires_at ? formatDate(subscription.expires_at) : "—"}
          </p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={async () => {
            await api.subscriptions.cancel();
            setSubscription(null);
          }}>
            Annuler l&apos;abonnement
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-10">
        {PREMIUM_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`glass-card p-6 relative ${plan.popular ? "border border-[#c9a962]/40 ring-1 ring-[#c9a962]/20" : ""}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#c9a962] px-3 py-0.5 text-xs font-semibold text-[#0a0a0b]">
                Populaire
              </span>
            )}
            <h3 className="font-display text-xl font-semibold">{plan.label}</h3>
            <p className="mt-2">
              <span className="text-3xl font-bold text-[#c9a962]">{plan.price.toFixed(2)}</span>
              <span className="text-sm text-[#9a8f8a]"> CAD</span>
            </p>
            <Link href={`/premium/checkout?plan=${plan.durationMonths}`}>
              <Button variant={plan.popular ? "gold" : "outline"} className="w-full mt-6">
                Choisir
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <div className="glass-card p-8">
        <h2 className="font-display text-xl font-semibold mb-4">Avantages Premium</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PREMIUM_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-[#c9a962] flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
