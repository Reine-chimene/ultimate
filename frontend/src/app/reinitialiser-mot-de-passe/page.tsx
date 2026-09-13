"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.resetPassword(token, password);
      setMessage(res.detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lien invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-[#9a8f8a]">Lien de réinitialisation invalide.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="premium-card w-full max-w-md p-8 md:p-10">
        <div className="text-center">
          <Logo />
          <h1 className="mt-6 font-display text-2xl font-semibold">Nouveau mot de passe</h1>
        </div>
        <form className="mt-8 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <Input label="Nouveau mot de passe" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirmer" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button variant="gold" className="w-full" type="submit" disabled={loading}>
            {loading ? "Mise à jour..." : "Réinitialiser"}
          </Button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-[#c9a962]">
            {message}{" "}
            <Link href="/connexion" className="underline">Se connecter</Link>
          </p>
        )}
        {error && <p className="mt-4 text-center text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4">
          <p className="text-[#9a8f8a]">Chargement...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
