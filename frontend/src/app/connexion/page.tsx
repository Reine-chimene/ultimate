"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

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
      router.push(user.role === "admin" ? "/admin" : "/decouvrir");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8 animate-slide-up">
        <div className="text-center">
          <Logo showTagline />
          <h1 className="mt-6 font-display text-2xl font-semibold">Connexion</h1>
          <p className="mt-1 text-sm text-[#9a8f8a]">Accédez à votre espace ULTIMATE</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input label="Courriel" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" loading={loading}>
            Se connecter
          </Button>
        </form>

        <div className="mt-6 text-center text-sm space-y-2">
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
