"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { appointmentApi, authApi } from "@/lib/api";
import { DashboardSkeleton } from "@/components/shared/Skeleton";

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, queueRes] = await Promise.allSettled([
          authApi.me(),
          user?.id ? appointmentApi.getByDoctor(user.id) : Promise.resolve([]),
        ]);

        if (meRes.status === "fulfilled" && meRes.value) setProfile((meRes.value as any).user || meRes.value);
        if (queueRes.status === "fulfilled" && queueRes.value) setQueue((queueRes.value as any).appointments || (queueRes.value as any[]));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const todayAppointments = queue.filter(
    (apt) => new Date(apt.date || apt.scheduledAt).toDateString() === new Date().toDateString()
  ) || [];

  const completedToday = todayAppointments.filter((apt) => apt.status === "completed").length;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dr. {user?.name}</h1>
          <p className="text-gray-500 mt-1">{profile?.specialization || t.doctor.specialization}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{t.doctor.rating}</p>
          <p className="text-2xl font-bold text-yellow-500">★ {profile?.rating || "N/A"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t.doctor.todayPatients}</p>
              <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
            </div>
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t.doctor.completed}</p>
              <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t.doctor.inProgress}</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayAppointments.filter((apt) => apt.status === "in_progress").length}
              </p>
            </div>
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t.doctor.totalConsultations}</p>
              <p className="text-2xl font-bold text-gray-900">{profile?.totalConsultations || 0}</p>
            </div>
            <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.doctor.patientQueue}</h2>
            <p className="text-sm text-gray-500 mb-4">{t.doctor.todayAppointments}</p>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div key={apt.id || apt._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{t.doctor.patientId}: {apt.patientId || apt.patient}</p>
                      <p className="text-sm text-gray-500">{new Date(apt.date || apt.scheduledAt).toLocaleTimeString()}</p>
                      <p className="text-xs text-gray-400 mt-1">{apt.reason || apt.notes || t.doctor.generalConsultation}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        apt.status === "completed" ? "bg-green-100 text-green-700" :
                        apt.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{apt.status}</span>
                      <button disabled={apt.status === "completed"} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50">
                        {apt.status === "in_progress" ? t.doctor.continue : t.doctor.start}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">{t.doctor.noAppointments}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.doctor.quickActions}</h2>
            <div className="space-y-3">
              <button onClick={() => router.push("/doctor")} className="w-full text-left rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">{t.doctor.viewSchedule}</button>
              <button onClick={() => router.push("/doctor")} className="w-full text-left rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-100">{t.doctor.createPrescription}</button>
              <button onClick={() => router.push("/doctor")} className="w-full text-left rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-100">{t.doctor.medicalRecords}</button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.doctor.profileInfo}</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">{t.doctor.license}</p>
                <p className="font-medium text-gray-900">{profile?.licenseNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500">{t.doctor.experience}</p>
                <p className="font-medium text-gray-900">{profile?.yearsOfExperience || 0} {t.doctor.years}</p>
              </div>
              <div>
                <p className="text-gray-500">{t.doctor.consultationFee}</p>
                <p className="font-medium text-gray-900">${profile?.consultationFee || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
