"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Subscription } from "@/types";
import { MEMBERSHIP_TIERS, PREMIUM_PLANS } from "@/lib/constants";
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
  const planLabel =
    subscription?.plan === "vip" ? "VIP Gold" : subscription?.plan === "premium" ? "Premium" : "Gratuit";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Membership"
        title="ULTIMATE Membership"
        subtitle="Monde entier gratuit pour tous. Premium débloque le Voyage, l'Incognito et la recherche avancée."
        centered
      />

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[#9a8f8a]">Votre plan actuel</h2>
        {loading ? (
          <p className="text-sm text-[#9a8f8a]">Chargement...</p>
        ) : isActive && subscription ? (
          <div className="premium-card border-[#c9a962]/30 p-6 text-center ring-1 ring-[#c9a962]/20">
            <Crown className="mx-auto h-8 w-8 text-[#c9a962]" />
            <p className="mt-3 font-display text-xl font-semibold text-[#c9a962]">{planLabel} actif</p>
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
            <p className="mt-1 text-sm text-[#9a8f8a]">
              Le Monde entier est inclus. Passez à Premium pour plus de possibilités.
            </p>
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-[#9a8f8a]">
          Comparer les plans
        </h2>
        <div className="grid gap-5 lg:grid-cols-3">
          {MEMBERSHIP_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`premium-card p-6 ${tier.highlight ? "ring-2 ring-[#c9a962]/40" : ""}`}
            >
              {tier.highlight && (
                <span className="mb-3 inline-block rounded-full bg-[#c9a962]/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#c9a962]">
                  Recommandé
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-[#c9a962]">{tier.price}</p>
              <ul className="mt-4 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#9a8f8a]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a962]" />
                    {f}
                  </li>
                ))}
              </ul>
              {tier.id === "premium" && (
                <Link href="/premium/checkout?plan=1" className="mt-6 block">
                  <Button variant="gold" className="w-full">Choisir Premium</Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-[#9a8f8a]">Durées Premium · CAD</h2>
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
                  Populaire
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

      <section className="premium-card p-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#c9a962]" />
          <h2 className="font-display text-xl font-semibold">Pourquoi Premium ?</h2>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#9a8f8a]">
          ULTIMATE est une plateforme adulte mondiale. Le Monde entier reste gratuit pour tous.
          Premium est conçu pour ceux qui veulent aller plus loin : voyager, rester discret,
          filtrer avec précision et maximiser leurs connexions.
        </p>
        <p className="mt-6 text-xs text-[#9a8f8a]/70">
          Le paiement est simulé pour cette démo. Aucun frais réel n&apos;est prélevé.
        </p>
      </section>
    </div>
  );
}
