import { Shield } from "lucide-react";

const TIPS = [
  "Privilégiez un lieu public pour votre première rencontre.",
  "Ne partagez pas votre adresse exacte.",
  "Prévenez une personne de confiance de votre rendez-vous.",
  "Gardez le contrôle de vos moyens de transport.",
];

export function SafetyTips({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4" : "premium-card p-5"}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#c9a962]">
        <Shield className="h-4 w-4" />
        Conseils pour une rencontre en toute sécurité
      </div>
      <ul className="space-y-1.5 text-sm text-[#9a8f8a]">
        {TIPS.map((tip) => (
          <li key={tip} className="flex gap-2">
            <span className="text-[#c9a962]">•</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
