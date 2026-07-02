"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { mockUsers, mockAuditEvents } from "@/lib/mock-data";
import { Skeleton } from "@/components/shared/Skeleton";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  mfa_enabled: boolean;
  is_active: boolean;
  locale: string;
  created_at: string;
}

interface AuditEventItem {
  id: number;
  event_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  timestamp: string;
  actor_email: string;
  details: Record<string, unknown>;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("unitycare_token");
    if (!token) {
      setUsers(mockUsers);
      setAuditEvents(mockAuditEvents);
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    if (tab === "users") {
      fetch(`${API}/admin/users`, { headers })
        .then((r) => r.json())
        .then(setUsers)
        .catch(() => setUsers(mockUsers))
        .finally(() => setLoading(false));
    } else {
      fetch(`${API}/audit/events?limit=50`, { headers })
        .then((r) => r.json())
        .then((d) => setAuditEvents(d.events || d || []))
        .catch(() => setAuditEvents(mockAuditEvents))
        .finally(() => setLoading(false));
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : tab === "users" ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">{t.common.error}</p>
          ) : (
            <div className="space-y-3">
              {users.map((u: AdminUser) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{u.full_name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          {auditEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">{t.admin.auditLogs}</p>
          ) : (
            <div className="space-y-2">
              {auditEvents.map((e: AuditEventItem, i: number) => (
                <div key={e.event_id || i} className="flex items-center justify-between rounded-lg border border-gray-50 p-3 text-sm">
                  <span className="font-medium text-gray-900">{e.action}</span>
                  <span className="text-gray-500">{e.resource_type} / {e.resource_id?.slice(0, 8)}...</span>
                  <span className="text-gray-400">{new Date(e.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
