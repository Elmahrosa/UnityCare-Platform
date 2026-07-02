"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { mockConsents, mockVitals } from "@/lib/mock-data";
import { DashboardSkeleton } from "@/components/shared/Skeleton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Consent { id: string; purpose: string; status: string; jurisdiction: string; created_at: string }
interface VitalSigns { heart_rate?: number; oxygen_saturation?: number; blood_pressure_systolic?: number; blood_pressure_diastolic?: number; temperature?: number }

function fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  return fetch(url, { headers }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
}

export default function PatientDashboard() {
  const { t } = useTranslation();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("unitycare_token");
    if (!token) {
      setConsents(mockConsents as Consent[]);
      setVitalSigns(mockVitals["a1b2c3d4"] as VitalSigns);
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    fetchJson<{ id: string }>(`${API}/admin/users/me`, headers)
      .then((u) =>
        Promise.all([
          fetchJson<Consent[]>(`${API}/consent/patient/${u.id}`, headers).catch(() => mockConsents),
          fetchJson<VitalSigns>(`${API}/iot/${u.id}/vitals`, headers).catch(() => mockVitals["a1b2c3d4"] ?? null),
        ])
      )
      .then(([consentData, vitalsData]) => {
        setConsents(consentData);
        setVitalSigns(vitalsData);
      })
      .catch(() => {
        setConsents(mockConsents as Consent[]);
        setVitalSigns(mockVitals["a1b2c3d4"] as VitalSigns);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{t.patient.profile}</h1>

      {vitalSigns && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {vitalSigns.heart_rate !== undefined && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Heart Rate</p>
              <p className="text-xl font-bold text-gray-900">{vitalSigns.heart_rate} <span className="text-sm font-normal text-gray-500">bpm</span></p>
            </div>
          )}
          {vitalSigns.oxygen_saturation !== undefined && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">O2 Saturation</p>
              <p className="text-xl font-bold text-gray-900">{vitalSigns.oxygen_saturation} <span className="text-sm font-normal text-gray-500">%</span></p>
            </div>
          )}
          {vitalSigns.blood_pressure_systolic !== undefined && vitalSigns.blood_pressure_diastolic !== undefined && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">Blood Pressure</p>
              <p className="text-xl font-bold text-gray-900">{vitalSigns.blood_pressure_systolic}/{vitalSigns.blood_pressure_diastolic} <span className="text-sm font-normal text-gray-500">mmHg</span></p>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.patient.consents}</h2>
        {consents.length === 0 ? (
          <p className="text-sm text-gray-500">{t.patient.noConsents}</p>
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
