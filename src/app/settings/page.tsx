"use client";

import { useEffect, useState } from "react";

interface RedactedSettings {
  steamApiKey: string;
  steamId: string;
  psnNpsso: string;
  hasSteam: boolean;
  hasPsn: boolean;
}

function SteamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.68 2 2.34 6.03 2 11.14l5.68 2.35a3 3 0 0 1 1.7-.52c.06 0 .11 0 .17.01l2.53-3.66v-.05a3.75 3.75 0 1 1 3.75 3.75h-.09l-3.6 2.57c0 .05.01.1.01.15a3 3 0 1 1-5.95-.6L2.4 13.4C3.1 18.24 7.1 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zM8.4 17.8l-1.3-.54a2.25 2.25 0 0 0 4.16-1.7l-1.3-.53a1.13 1.13 0 1 1-1.56 2.77zm7.55-8.55a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5zm0-1a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z" />
    </svg>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<RedactedSettings | null>(null);
  const [psnNpsso, setPsnNpsso] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/settings")
      .then((res) => res.json())
      .then(setSettings);
  }

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    if (params.has("steam_connected")) {
      setStatus("Compte Steam connecté.");
      window.history.replaceState({}, "", "/settings");
    } else if (params.has("steam_error")) {
      setStatus("La connexion Steam a échoué, réessaie.");
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  async function savePsn(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ psnNpsso }),
      });
      if (!res.ok) throw new Error();
      setPsnNpsso("");
      setStatus("Enregistré.");
      load();
    } catch {
      setStatus("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect(field: "steam" | "psn") {
    await fetch(`/api/settings?field=${field}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-shelf-text">
          Réglages
        </h1>
        <p className="text-shelf-muted text-sm mt-1">
          Connecte tes comptes pour récupérer ta bibliothèque. Les identifiants
          sont stockés uniquement sur ce serveur, rattachés à ton compte.
        </p>
      </div>

      <section className="bg-shelf-card border border-shelf-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-shelf-text">Steam</h2>
          {settings?.hasSteam && (
            <span className="text-xs text-sage">Connecté</span>
          )}
        </div>

        {settings?.hasSteam ? (
          <>
            <p className="text-xs text-shelf-muted">
              SteamID : {settings.steamId}
            </p>
            <button
              type="button"
              onClick={() => disconnect("steam")}
              className="text-xs text-rust hover:text-rust/80 underline"
            >
              Déconnecter Steam
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-shelf-muted">
              Ton profil Steam doit être public (Confidentialité → Détails du
              jeu → Public) pour que ta bibliothèque soit visible.
            </p>
            <a
              href="/api/steam/login"
              className="w-full flex items-center justify-center gap-2 bg-[#1b2838] text-[#66c0f4] border border-[#2a475e] text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#223a52] transition-colors"
            >
              <SteamIcon />
              Se connecter avec Steam
            </a>
          </>
        )}
      </section>

      <section className="bg-shelf-card border border-shelf-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-shelf-text">PlayStation</h2>
          {settings?.hasPsn && (
            <span className="text-xs text-sage">Connecté</span>
          )}
        </div>
        <p className="text-xs text-shelf-muted">
          1. Connecte-toi sur{" "}
          <span className="underline">my.playstation.com</span>.<br />
          2. Va sur{" "}
          <span className="underline">
            ca.account.sony.com/api/v1/ssocookie
          </span>{" "}
          (toujours connecté) et copie la valeur du champ{" "}
          <code className="bg-shelf-surface px-1 rounded">npsso</code>.
          <br />
          3. Colle-la ci-dessous (ce jeton expire après environ 2 mois). Sony
          n&apos;offre pas de connexion directe pour les apps tierces, cette
          étape manuelle est malheureusement incontournable.
        </p>
        <form onSubmit={savePsn} className="space-y-3">
          <input
            type="password"
            placeholder={
              settings?.psnNpsso ? "Jeton NPSSO (déjà enregistré)" : "Jeton NPSSO"
            }
            value={psnNpsso}
            onChange={(e) => setPsnNpsso(e.target.value)}
            className="w-full bg-shelf-surface border border-shelf-border rounded-lg px-3 py-2 text-sm text-shelf-text outline-none focus:border-brass/50"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !psnNpsso}
              className="bg-brass text-brass-ink text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brass-hover transition-colors disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            {settings?.hasPsn && (
              <button
                type="button"
                onClick={() => disconnect("psn")}
                className="text-xs text-rust hover:text-rust/80 underline"
              >
                Déconnecter PlayStation
              </button>
            )}
          </div>
        </form>
      </section>

      {status && <p className="text-sm text-shelf-muted">{status}</p>}
    </div>
  );
}
