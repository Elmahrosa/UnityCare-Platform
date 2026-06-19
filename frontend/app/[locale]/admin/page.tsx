"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("unitycare_token");
    if (!token) return;
    if (tab === "users") {
      fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).then(setUsers).catch(console.error).finally(() => setLoading(false));
    } else {
      fetch(`${API}/audit/events?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).then((d) => setAuditEvents(d.events || [])).catch(console.error).finally(() => setLoading(false));
    }
  }, [tab]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">{t.admin.users}</h1>
      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("users")} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "users" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>{t.admin.users}</button>
        <button onClick={() => setTab("audit")} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "audit" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>{t.admin.auditLogs}</button>
      </div>
      {loading ? (
        <p className="text-gray-500">{t.common.loading}</p>
      ) : tab === "users" ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="space-y-3">
            {users.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="font-medium text-gray-900">{u.full_name}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="space-y-2">
            {auditEvents.map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-gray-50 p-3 text-sm">
                <span className="font-medium text-gray-900">{e.action}</span>
                <span className="text-gray-500">{e.resource_type} / {e.resource_id?.slice(0, 8)}...</span>
                <span className="text-gray-400">{new Date(e.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
