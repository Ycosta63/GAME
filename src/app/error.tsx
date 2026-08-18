"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-4">
      <p className="text-shelf-text font-semibold">
        Un problème est survenu en affichant cette page.
      </p>
      <p className="text-shelf-muted text-sm break-words">
        {error.message || "Erreur inconnue."}
      </p>
      <button
        onClick={reset}
        className="bg-brass text-brass-ink text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brass-hover transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
