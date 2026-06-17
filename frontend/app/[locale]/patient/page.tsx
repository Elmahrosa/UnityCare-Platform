"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Consent { id: string; purpose: string; status: string; jurisdiction: string; created_at: string }

export default function PatientDashboard() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("unitycare_token");
    if (!token) return;
    fetch(`${API}/admin/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((u) => {
        setUserId(u.id);
        return fetch(`${API}/consent/patient/${u.id}`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then((r) => r.json())
      .then((c) => setConsents(c))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Patient Dashboard</h1>
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">My Consents</h2>
        {consents.length === 0 ? (
          <p className="text-sm text-gray-500">No consents found.</p>
        ) : (
          <div className="space-y-3">
            {consents.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{c.purpose}</span>
                  <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{c.status}</span>
                  <span className="ml-2 text-xs text-gray-400">{c.jurisdiction}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
