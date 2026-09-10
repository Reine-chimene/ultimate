"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import type { User } from "@/types";
export default function AdminProfilesPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api.admin.users(0, 50).then((d) => setUsers(d.users));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Modération des profils</h1>
      <p className="text-sm text-[#9a8f8a] mb-6">Aperçu des profils utilisateurs pour modération.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.filter((u) => u.role === "user").map((u) => (
          <div key={u.id} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-white/10">
                <Image
                  src={`https://i.pravatar.cc/150?u=${u.id}`}
                  alt={u.first_name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium">{u.first_name}</p>
                <p className="text-xs text-[#9a8f8a]">{u.city}</p>
              </div>
            </div>
            <p className="text-xs text-[#9a8f8a] mt-3">{u.email}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
              u.is_active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
            }`}>
              {u.is_active ? "Approuvé" : "Désactivé"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
