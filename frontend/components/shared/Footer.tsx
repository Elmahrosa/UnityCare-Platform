"use client";

interface FooterProps { locale: string }

export default function Footer({ locale }: FooterProps) {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
        <p className="text-sm text-gray-500">© 2026 UnityCare. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="mailto:contact@elmahrosa.org" className="text-sm text-gray-500 hover:text-gray-700">contact@elmahrosa.org</a>
        </div>
      </div>
    </footer>
  );
}
