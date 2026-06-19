"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Consent { id: string; purpose: string; status: string; jurisdiction: string; created_at: string }
interface VitalSigns { heartRate?: number; oxygenSaturation?: number; bloodPressure?: string; temperature?: number }

export default function PatientDashboard() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("unitycare_token");
    if (!token) return;

    fetch(`${API}/admin/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((u) => {
        return Promise.all([
          fetch(`${API}/consent/patient/${u.id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
          fetch(`${API}/iot/${u.id}/vitals`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null),
        ]);
      })
      .then(([consentData, vitalsData]) => {
        setConsents(consentData);
        setVitalSigns(vitalsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>

      {vitalSigns && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {vitalSigns.heartRate !== undefined && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Heart Rate</p>
              <p className="text-xl font-bold text-gray-900">{vitalSigns.heartRate} <span className="text-sm font-normal text-gray-500">bpm</span></p>
            </div>
          )}
          {vitalSigns.oxygenSaturation !== undefined && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">O2 Saturation</p>
              <p className="text-xl font-bold text-gray-900">{vitalSigns.oxygenSaturation} <span className="text-sm font-normal text-gray-500">%</span></p>
            </div>
          )}
          {vitalSigns.bloodPressure && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Blood Pressure</p>
              <p className="text-xl font-bold text-gray-900">{vitalSigns.bloodPressure} <span className="text-sm font-normal text-gray-500">mmHg</span></p>
            </div>
          )}
          {vitalSigns.temperature !== undefined && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Temperature</p>
              <p className="text-xl font-bold text-gray-900">{vitalSigns.temperature} <span className="text-sm font-normal text-gray-500">°C</span></p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Consents</h2>
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
