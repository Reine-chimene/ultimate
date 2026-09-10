"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Report } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  const load = () => api.admin.reports().then(setReports);
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await api.admin.updateReport(id, status);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Signalements</h1>

      {reports.length === 0 ? (
        <div className="glass-card p-12 text-center text-[#9a8f8a]">Aucun signalement.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="glass-card p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{r.reason}</p>
                  {r.description && <p className="text-sm text-[#9a8f8a] mt-1">{r.description}</p>}
                  <p className="text-xs text-[#9a8f8a] mt-2">{formatDateTime(r.created_at)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === "pending" ? "bg-yellow-500/20 text-yellow-300" :
                  r.status === "resolved" ? "bg-green-500/20 text-green-300" :
                  "bg-white/10 text-[#9a8f8a]"
                }`}>
                  {r.status}
                </span>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2 mt-4">
                  <Button variant="gold" size="sm" onClick={() => updateStatus(r.id, "resolved")}>Résoudre</Button>
                  <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, "dismissed")}>Rejeter</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
