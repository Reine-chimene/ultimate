"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    email: "",
    password: "",
    date_of_birth: "",
    gender: "female",
    city: "",
    terms_accepted: false,
    is_adult: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.terms_accepted || !form.is_adult) {
      setError("Vous devez accepter les conditions et confirmer avoir 18 ans ou plus");
      return;
    }
    setLoading(true);
    try {
      await register({
        ...form,
        gender: form.gender,
        terms_accepted: true,
        is_adult: true,
      });
      router.push("/decouvrir");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="glass-card w-full max-w-lg p-8 animate-slide-up">
        <div className="text-center">
          <Logo showTagline />
          <h1 className="mt-6 font-display text-2xl font-semibold">Créer un compte</h1>
          <p className="mt-1 text-sm text-[#9a8f8a]">Réservé aux personnes de 18 ans et plus</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input label="Prénom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          <Input label="Courriel" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Mot de passe" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          <Input label="Date de naissance" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required />
          <Select label="Genre" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="female">Femme</option>
            <option value="male">Homme</option>
            <option value="non_binary">Non-binaire</option>
            <option value="other">Autre</option>
          </Select>
          <Input label="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required placeholder="Montréal" />

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={form.is_adult} onChange={(e) => setForm({ ...form, is_adult: e.target.checked })} className="mt-1" />
            <span>Je confirme avoir 18 ans ou plus</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={form.terms_accepted} onChange={(e) => setForm({ ...form, terms_accepted: e.target.checked })} className="mt-1" />
            <span>
              J&apos;accepte les{" "}
              <Link href="/conditions" className="text-[#c9a962] hover:underline">conditions d&apos;utilisation</Link>
              {" "}et la{" "}
              <Link href="/confidentialite" className="text-[#c9a962] hover:underline">politique de confidentialité</Link>
            </span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" loading={loading}>
            Créer mon compte
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#9a8f8a]">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="text-[#c9a962] hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
