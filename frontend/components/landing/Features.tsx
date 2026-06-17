"use client";

const features = [
  { title: "Identity & Access", desc: "Patient and provider identity with MFA, SSO, and role-based access control. FHIR-compliant from day one." },
  { title: "FHIR R4 Gateway", desc: "Full FHIR R4 API for Patient, Practitioner, and clinical resources. Certified interoperability backbone." },
  { title: "Consent Engine", desc: "Granular consent management for treatment, research, AI processing, data sharing, and cross-border transfer." },
  { title: "Immutable Audit", desc: "Hash-chained audit ledger tracking every healthcare action. Tamper-evident, SIEM-ready, regulation-proof." },
  { title: "Zero Trust Security", desc: "OAuth2, OIDC, MFA, encryption at rest and in transit. SOC 2 and HIPAA aligned architecture." },
  { title: "Arabic-First UX", desc: "Full RTL support with Arabic-language clinical terminology, Hijri calendar, and localized regulatory compliance." },
];

export default function Features() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Enterprise Healthcare Platform</h2>
          <p className="mt-4 text-lg text-gray-600">Built for regulated healthcare markets from day one</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
