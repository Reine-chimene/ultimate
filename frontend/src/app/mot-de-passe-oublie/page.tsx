"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.auth.forgotPassword(email);
      setMessage(res.detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="premium-card w-full max-w-md p-8 animate-slide-up md:p-10">
        <div className="text-center">
          <Logo />
          <h1 className="mt-6 font-display text-2xl font-semibold">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-[#9a8f8a]">
            Entrez votre courriel et nous vous enverrons un lien de réinitialisation si un compte existe.
          </p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <Input label="Courriel" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="gold" className="w-full" type="submit" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le lien"}
          </Button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-[#c9a962]">{message}</p>}
        {error && <p className="mt-4 text-center text-sm text-red-300">{error}</p>}
        <p className="mt-6 text-center text-sm text-[#9a8f8a]">
          <Link href="/connexion" className="text-[#c9a962] hover:underline">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
