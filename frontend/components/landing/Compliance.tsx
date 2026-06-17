"use client";

const standards = [
  { name: "HIPAA", desc: "US Health Insurance Portability and Accountability Act" },
  { name: "GDPR", desc: "EU General Data Protection Regulation" },
  { name: "EHDS", desc: "European Health Data Space / MyHealth@EU" },
  { name: "NPHIES", desc: "Saudi National Platform for Health and Insurance Exchange" },
  { name: "SOC 2", desc: "Service Organization Control Type II" },
  { name: "ISO 27001", desc: "Information Security Management" },
];

export default function Compliance() {
  return (
    <section id="compliance" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Regulatory Compliance</h2>
          <p className="mt-4 text-lg text-gray-600">Certification-ready architecture for every market</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {standards.map((s) => (
            <div key={s.name} className="rounded-xl border border-gray-200 bg-white p-5 text-center">
              <div className="text-lg font-bold text-blue-600">{s.name}</div>
              <div className="mt-1 text-sm text-gray-500">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
