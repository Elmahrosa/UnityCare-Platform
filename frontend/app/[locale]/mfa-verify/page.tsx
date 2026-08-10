"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function MFAVerifyPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("unitycare_token");
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    // Optionally, we could check if the user actually has MFA enabled here.
    // For simplicity, we assume we only get to this page if MFA is enabled.
  }, [router, locale]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("unitycare_token");
    try {
      const res = await fetch(`${API}/auth/mfa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Invalid code");
      }
      // Verification successful, now redirect to appropriate dashboard
      // Fetch user to determine role
      const meRes = await fetch(`${API}/admin/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) throw new Error("Failed to fetch user");
      const user = await meRes.json();
      const isPrivileged = user.role === "admin" || user.role === "provider";
      if (isPrivileged) {
        router.push(user.role === "admin" ? "/admin" : user.role === "provider" ? "/doctor" : "/patient");
      } else {
        router.push("/patient");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <p className="text-gray-500">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Verify MFA</h1>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700">
              Enter the 6-digit code from your authenticator app
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>
          <button type="submit" disabled={loading || code.length !== 6} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
          <div className="text-center text-sm">
            <Link href={`/${locale}/mfa-setup`} className="text-gray-500 hover:underline">
              Didn't receive a code? Resend or setup new
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}