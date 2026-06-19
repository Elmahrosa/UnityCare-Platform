"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white/80 p-8 text-center shadow-lg backdrop-blur">
        <div className="mb-4 text-6xl font-bold text-red-400">404</div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Page Not Found</h2>
        <p className="mb-8 text-gray-600">
          Sorry, the page you are looking for doesn&apos;t exist.
          <br />
          It may have been moved or deleted.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-white shadow-md transition hover:bg-blue-700"
        >
          {t.nav.home}
        </Link>
      </div>
    </div>
  );
}
