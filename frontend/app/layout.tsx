import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UnityCare — Healthcare Trust Infrastructure",
  description: "Identity, consent, and interoperability platform for regulated healthcare markets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-white font-sans antialiased">{children}</body>
    </html>
  );
}
