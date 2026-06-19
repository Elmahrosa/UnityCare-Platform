"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function Features() {
  const { t } = useTranslation();
  const items = [
    t.features.identity,
    t.features.fhir,
    t.features.consent,
    t.features.audit,
    t.features.security,
    t.features.arabic,
  ];
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">{t.features.title}</h2>
          <p className="mt-4 text-lg text-gray-600">{t.features.subtitle}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
