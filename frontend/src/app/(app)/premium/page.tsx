"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Subscription } from "@/types";
import { PREMIUM_FEATURES, PREMIUM_PLANS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/utils";

export default function PremiumPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.subscriptions.me().then(setSubscription).catch(() => setSubscription(null)).finally(() => setLoading(false));
  }, []);

  const isActive = subscription?.status === "active" && subscription.plan !== "free";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Membership"
        title="ULTIMATE Premium"
        subtitle="Découverte internationale, Mode Voyage et filtres avancés pour une expérience sans frontières."
        centered
      />

      {/* Current plan */}
      <section className="mb-10">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[#9a8f8a]">Votre plan actuel</h2>
        {loading ? (
          <p className="text-sm text-[#9a8f8a]">Chargement...</p>
        ) : isActive && subscription ? (
          <div className="premium-card border-[#c9a962]/30 p-6 text-center ring-1 ring-[#c9a962]/20">
            <Crown className="mx-auto h-8 w-8 text-[#c9a962]" />
            <p className="mt-3 font-display text-xl font-semibold text-[#c9a962]">Premium actif</p>
            <p className="mt-1 text-sm text-[#9a8f8a]">
              Expire le {subscription.expires_at ? formatDate(subscription.expires_at) : "—"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={async () => {
                await api.subscriptions.cancel();
                setSubscription(null);
              }}
            >
              Annuler l&apos;abonnement
            </Button>
          </div>
        ) : (
          <div className="premium-card p-6 text-center">
            <p className="font-medium">Plan gratuit</p>
            <p className="mt-1 text-sm text-[#9a8f8a]">Passez à Premium pour débloquer tous les avantages.</p>
          </div>
        )}
      </section>

      {/* Available plans */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-[#9a8f8a]">Plans disponibles · CAD</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {PREMIUM_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`premium-card relative p-6 transition ${
                plan.popular ? "ring-2 ring-[#c9a962]/40" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#c9a962] px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0b]">
                  Recommandé
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{plan.label}</h3>
              <p className="mt-3">
                <span className="text-3xl font-bold text-[#c9a962]">{plan.price.toFixed(2)}</span>
                <span className="text-sm text-[#9a8f8a]"> $ CAD</span>
              </p>
              <Link href={`/premium/checkout?plan=${plan.durationMonths}`}>
                <Button variant={plan.popular ? "gold" : "outline"} className="mt-6 w-full">
                  Choisir ce plan
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="premium-card p-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#c9a962]" />
          <h2 className="font-display text-xl font-semibold">Avantages Premium</h2>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {PREMIUM_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm">
              <Check className="h-4 w-4 shrink-0 text-[#c9a962]" />
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-[#9a8f8a]/70">
          Le paiement est simulé pour cette démo. Aucun frais réel n&apos;est prélevé.
        </p>
      </section>
    </div>
  );
}
