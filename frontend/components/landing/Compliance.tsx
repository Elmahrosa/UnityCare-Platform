"use client";

import { useTranslation } from "@/hooks/useTranslation";

const standards = [
  { name: "HIPAA", key: "hipaa" },
  { name: "GDPR", key: "gdpr" },
  { name: "EHDS", key: "ehhds" },
  { name: "NPHIES", key: "nphies" },
  { name: "SOC 2", key: "soc2" },
  { name: "ISO 27001", key: "iso" },
] as const;

export default function Compliance() {
  const { t } = useTranslation();
  return (
    <section id="compliance" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">{t.compliance.title}</h2>
          <p className="mt-4 text-lg text-gray-600">{t.compliance.subtitle}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {standards.map((s) => (
            <div key={s.name} className="rounded-xl border border-gray-200 bg-white p-5 text-center">
              <div className="text-lg font-bold text-blue-600">{s.name}</div>
              <div className="mt-1 text-sm text-gray-500">{t.compliance[s.key as keyof typeof t.compliance]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
