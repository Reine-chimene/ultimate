"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { TAGLINE } from "@/lib/constants";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "admin") router.push("/admin");
      else if (!user.onboarding_completed) router.push("/onboarding");
      else router.push("/decouvrir");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="premium-card w-full max-w-md p-8 animate-slide-up md:p-10">
        <div className="text-center">
          <Logo showTagline />
          <p className="section-label mt-6">{TAGLINE}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Connexion</h1>
          <p className="mt-1 text-sm text-[#9a8f8a]">Accédez à votre espace ULTIMATE</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input label="Courriel" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" loading={loading}>
            Se connecter
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <Link href="/mot-de-passe-oublie" className="text-[#c9a962] hover:underline">
            Mot de passe oublié ?
          </Link>
          <p className="text-[#9a8f8a]">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-[#c9a962] hover:underline">S&apos;inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
