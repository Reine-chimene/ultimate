"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import { getCountry } from "@/lib/countries";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const load = () => api.admin.users().then((d) => { setUsers(d.users); setTotal(d.total); });
  useEffect(() => { load(); }, []);

  const filtered = users.filter(
    (u) =>
      u.first_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleActive = async (user: User) => {
    await api.admin.updateUser(user.id, { is_active: !user.is_active });
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Gestion des utilisateurs</h1>
      <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <p className="text-sm text-[#9a8f8a] mb-4">{total} utilisateurs au total</p>

      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="glass-card flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{u.first_name} <span className="text-[#9a8f8a] text-sm">({u.email})</span></p>
              <p className="text-xs text-[#9a8f8a]">
                {getCountry(u.country).flag} {u.city}, {getCountry(u.country).nameFr} · {u.timezone} · {u.role} · Inscrit le {formatDate(u.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                {u.is_active ? "Actif" : "Inactif"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => toggleActive(u)}>
                {u.is_active ? "Désactiver" : "Réactiver"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
