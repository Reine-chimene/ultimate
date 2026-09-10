"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Bell, Lock, User } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [blocks, setBlocks] = useState<{ id: string; blocked_id: string }[]>([]);

  useEffect(() => {
    api.reports.blocks().then(setBlocks).catch(() => {});
  }, []);

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
          <p className="text-sm text-[#9a8f8a]">Seule votre ville est visible. Votre localisation exacte n&apos;est jamais partagée.</p>
          <p className="text-sm text-[#9a8f8a] mt-2">Vos coordonnées personnelles ne sont pas exposées aux autres utilisateurs.</p>
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
