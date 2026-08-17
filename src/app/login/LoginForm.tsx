"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import ShelfieMark from "@/components/ShelfieMark";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-shelf-card border border-shelf-border rounded-2xl p-8 w-full max-w-sm space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-brass">
            <ShelfieMark className="w-10 h-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-shelf-text">
              Shelfie
            </h1>
            <p className="text-shelf-muted text-sm mt-1">
              Connecte-toi pour accéder à ta bibliothèque et relier tes
              comptes Steam et PlayStation.
            </p>
          </div>
        </div>
        <button
          onClick={() => signIn("google", { callbackUrl: next })}
          className="w-full flex items-center justify-center gap-2 bg-shelf-text text-shelf-bg text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <GoogleIcon />
          Continuer avec Google
        </button>
        <p className="text-shelf-muted/70 text-xs">
          Ta bibliothèque est privée : personne d&apos;autre ne peut la voir.
        </p>
      </div>
    </div>
  );
}
