"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function MFASetupPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<"loading" | "setup" | "verify" | "done">("loading");
  const [secret, setSecret] = useState("");
  const [provisioningUri, setProvisioningUri] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("unitycare_token");
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    fetch(`${API}/admin/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((u) => {
        if (u.mfa_enabled) {
          setStep("done");
        } else {
          setStep("setup");
        }
      })
      .catch(() => router.push(`/${locale}/login`));
  }, [router, locale]);

  const handleSetup = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("unitycare_token");
    try {
      const res = await fetch(`${API}/auth/mfa/setup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to generate MFA secret");
      const data = await res.json();
      setSecret(data.secret);
      setProvisioningUri(data.provisioning_uri);
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("unitycare_token");
    try {
      const res = await fetch(`${API}/auth/mfa/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Invalid code"); }
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    const pwd = prompt("Enter your password to disable MFA:");
    if (!pwd) return;
    setLoading(true);
    setError("");
    const token = localStorage.getItem("unitycare_token");
    try {
      const res = await fetch(`${API}/auth/mfa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: pwd }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Failed to disable"); }
      setStep("setup");
      setCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (step === "loading") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <p className="text-gray-500">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Multi-Factor Authentication</h1>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <div className="rounded-full bg-green-100 p-3 mx-auto w-fit">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-lg font-medium text-gray-900">MFA is enabled</p>
            <p className="text-sm text-gray-500">Your account is protected with two-factor authentication.</p>
            <button onClick={handleDisable} disabled={loading} className="w-full rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50">
              Disable MFA
            </button>
            <Link href={`/${locale}/admin`} className="block text-center text-sm text-blue-600 hover:underline">
              Back to Dashboard
            </Link>
          </div>
        )}

        {step === "setup" && (
          <div className="space-y-4 text-center">
            <p className="text-gray-600">Set up two-factor authentication using your authenticator app (Google Authenticator, Authy, etc.).</p>
            <button onClick={handleSetup} disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Generating..." : "Generate Secret Key"}
            </button>
            <Link href={`/${locale}/admin`} className="block text-center text-sm text-gray-500 hover:underline">
              Skip for now
            </Link>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="mb-2 text-sm font-medium text-gray-700">Scan this QR code with your authenticator app:</p>
              {provisioningUri && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(provisioningUri)}`}
                  alt="MFA QR Code"
                  className="mx-auto rounded-lg"
                />
              )}
              <p className="mt-2 text-xs text-gray-400 break-all">{secret}</p>
            </div>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700">Verification Code</label>
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
                {loading ? "Verifying..." : "Verify & Enable"}
              </button>
            </form>
            <button onClick={handleSetup} className="w-full text-sm text-gray-500 hover:text-gray-700">
              Regenerate secret
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
