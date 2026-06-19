"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  locale: string;
}

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = pathname.startsWith("/ar") ? "ar" : "en";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  useEffect(() => {
    const stored = localStorage.getItem("unitycare_token");
    if (stored) {
      fetch(`${API}/admin/users/me`, { headers: { Authorization: `Bearer ${stored}` } })
        .then((r) => r.json())
        .then((u) => setUser(u))
        .catch(() => localStorage.removeItem("unitycare_token"));
    }
  }, []);

  return (
    <>
      <Header locale={locale} user={user} onLogout={() => { localStorage.removeItem("unitycare_token"); setUser(null); }} />
      <main className="min-h-[calc(100vh-4rem)]"><ErrorBoundary>{children}</ErrorBoundary></main>
      <Footer />
    </>
  );
}
