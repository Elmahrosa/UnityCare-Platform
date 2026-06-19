"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900">
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Healthcare Trust Infrastructure<br />for the Connected World
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
          Identity, consent, and interoperability platform powering secure healthcare data exchange across Egypt, GCC, EU, and US markets.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/register" className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow-lg hover:bg-blue-50">
            Get Started
          </Link>
          <a href="#features" className="rounded-xl border border-white/30 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
