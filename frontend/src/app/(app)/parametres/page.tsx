"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { Shield, Bell, Lock, User, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { PremiumGate } from "@/components/premium/PremiumGate";
import type { PrivacySettings } from "@/types";

function PrivacyToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  const descId = `${id}-desc`;
  const stateId = `${id}-state`;

  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.06] last:border-0">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm font-medium cursor-pointer">
          {label}
        </label>
        <p id={descId} className="mt-1 text-sm text-[#9a8f8a]">
          {description}
        </p>
        <span id={stateId} className="sr-only">
          {checked ? "Activé" : "Désactivé"}
        </span>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${descId} ${stateId}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-9 w-16 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50 ${
          checked ? "bg-[#6b1d3a]" : "bg-white/10"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-300 ${
            checked ? "left-8" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [blocks, setBlocks] = useState<{ id: string; blocked_id: string }[]>([]);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [privacyLoading, setPrivacyLoading] = useState(true);
  const [privacySaving, setPrivacySaving] = useState(false);

  useEffect(() => {
    api.reports.blocks().then(setBlocks).catch(() => {});
  }, []);

  useEffect(() => {
    api.profiles
      .privacy()
      .then(setPrivacy)
      .catch(() =>
        setPrivacy({
          show_online: true,
          show_last_seen: true,
          incognito_enabled: false,
          can_use_incognito: false,
        }),
      )
      .finally(() => setPrivacyLoading(false));
  }, []);

  const updatePrivacy = useCallback(async (
    key: "show_online" | "show_last_seen" | "incognito_enabled",
    value: boolean,
  ) => {
    if (!privacy) return;
    const previous = privacy;
    setPrivacy({ ...privacy, [key]: value });
    setPrivacySaving(true);
    try {
      const updated = await api.profiles.updatePrivacy({ [key]: value });
      setPrivacy(updated);
    } catch {
      setPrivacy(previous);
    } finally {
      setPrivacySaving(false);
    }
  }, [privacy]);

  const handleUnblock = async (id: string) => {
    await api.reports.unblock(id);
    setBlocks((b) => b.filter((x) => x.blocked_id !== id));
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6">Paramètres du compte</h1>

      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <User className="h-5 w-5 text-[#c9a962]" />
            <h2 className="font-medium">Profil</h2>
          </div>
          <p className="text-sm text-[#9a8f8a]">{user?.email}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/mon-profil/modifier"><Button variant="outline" size="sm">Modifier le profil</Button></Link>
            <Link href="/preferences"><Button variant="ghost" size="sm">Préférences</Button></Link>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="h-5 w-5 text-[#c9a962]" />
            <h2 className="font-medium">Confidentialité</h2>
          </div>
          <p className="text-sm text-[#9a8f8a] mb-4">
            Seule votre ville est visible. Votre localisation exacte n&apos;est jamais partagée.
          </p>
          {privacyLoading ? (
            <p className="text-sm text-[#9a8f8a]">Chargement des préférences…</p>
          ) : privacy ? (
            <div>
              <PrivacyToggle
                label="Afficher mon statut en ligne"
                description="Les autres membres peuvent voir quand vous êtes en ligne."
                checked={privacy.show_online}
                disabled={privacySaving}
                onChange={(v) => void updatePrivacy("show_online", v)}
              />
              <PrivacyToggle
                label="Afficher mon activité récente"
                description="Les autres membres peuvent voir si vous avez été récemment actif."
                checked={privacy.show_last_seen}
                disabled={privacySaving}
                onChange={(v) => void updatePrivacy("show_last_seen", v)}
              />
            </div>
          ) : null}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <EyeOff className="h-5 w-5 text-[#c9a962]" />
            <h2 className="font-medium">Mode Incognito</h2>
          </div>
          {privacyLoading ? (
            <p className="text-sm text-[#9a8f8a]">Chargement…</p>
          ) : privacy?.can_use_incognito ? (
            <PrivacyToggle
              label="Activer le mode Incognito"
              description="Consultez les profils sans laisser de trace. Les autres membres ne verront pas votre visite."
              checked={privacy.incognito_enabled}
              disabled={privacySaving}
              onChange={(v) => void updatePrivacy("incognito_enabled", v)}
            />
          ) : (
            <PremiumGate message="Le mode Incognito permet de consulter les profils discrètement, sans enregistrer votre visite." />
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-[#c9a962]" />
            <h2 className="font-medium">Utilisateurs bloqués ({blocks.length})</h2>
          </div>
          {blocks.length === 0 ? (
            <p className="text-sm text-[#9a8f8a]">Aucun utilisateur bloqué.</p>
          ) : (
            blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2">
                <span className="text-sm">Utilisateur {b.blocked_id.slice(0, 8)}...</span>
                <Button variant="ghost" size="sm" onClick={() => handleUnblock(b.blocked_id)}>Débloquer</Button>
              </div>
            ))
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="h-5 w-5 text-[#c9a962]" />
            <h2 className="font-medium">Notifications</h2>
          </div>
          <Link href="/notifications" className="text-sm text-[#c9a962] hover:underline">Gérer les notifications →</Link>
        </div>

        <div className="glass-card p-5">
          <h2 className="font-medium mb-2">Profils passés</h2>
          <p className="text-sm text-[#9a8f8a] mb-3">Réinitialisez la liste des profils que vous avez passés en découverte.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await api.profiles.clearPasses();
              alert("Profils passés réinitialisés.");
            }}
          >
            Réinitialiser les profils passés
          </Button>
        </div>

        <div className="flex gap-2 pt-4">
          <Link href="/conditions" className="text-sm text-[#9a8f8a] hover:text-[#f5f0e8]">Conditions</Link>
          <span className="text-[#9a8f8a]">·</span>
          <Link href="/confidentialite" className="text-sm text-[#9a8f8a] hover:text-[#f5f0e8]">Confidentialité</Link>
        </div>

        <Button variant="danger" className="w-full mt-4" onClick={logout}>Déconnexion</Button>
      </div>
    </div>
  );
}
