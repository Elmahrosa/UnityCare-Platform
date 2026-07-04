"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      fetch("/api/frontend-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "error",
          message: error.message,
          stack: error.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch {
      // Log error silently on the frontend
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="flex items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">⚠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Critical Error
          </h1>
          <p className="text-gray-600 mb-6">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
