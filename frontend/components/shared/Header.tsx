"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

interface HeaderProps {
  locale: string;
  user: { id: string; full_name: string; role: string } | null;
  onLogout: () => void;
}

export default function Header({ locale, user, onLogout }: HeaderProps) {
  const { t } = useTranslation();
  const isAr = locale === "ar";
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <a href={`/${isAr ? "ar" : ""}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">U</div>
          <span className="text-lg font-semibold text-gray-900">UnityCare</span>
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          <a href={`/${isAr ? "ar" : ""}#features`} className="text-sm text-gray-600 hover:text-gray-900">{t.nav.features}</a>
          <a href={`/${isAr ? "ar" : ""}#compliance`} className="text-sm text-gray-600 hover:text-gray-900">{t.nav.compliance}</a>
          {user ? (
            <>
              <a href={user.role === "admin" ? "/admin" : "/patient"} className="text-sm font-medium text-blue-600 hover:text-blue-700">{t.nav.dashboard}</a>
              <button onClick={onLogout} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">{t.common.logout}</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">{t.nav.login}</Link>
              <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700">{t.common.register}</Link>
            </>
          )}
          <a href={isAr ? "/" : "/ar"} className="text-sm text-gray-500 hover:text-gray-700">{isAr ? t.common.english : t.common.arabic}</a>
        </nav>
      </div>
    </header>
  );
}
