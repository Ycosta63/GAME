"use client";

import { useEffect, useState } from "react";

interface RedactedSettings {
  steamApiKey: string;
  steamId: string;
  psnNpsso: string;
  psnNpssoSavedAt: string;
  hasSteam: boolean;
  hasPsn: boolean;
  hasGog: boolean;
}

// Sony doesn't document the NPSSO token's exact lifetime; ~2 months is the
// widely observed value among third-party PSN tools. Warn a bit early so
// there's time to refresh it before the library silently stops updating.
const PSN_TOKEN_WARN_AFTER_DAYS = 50;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function SteamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.68 2 2.34 6.03 2 11.14l5.68 2.35a3 3 0 0 1 1.7-.52c.06 0 .11 0 .17.01l2.53-3.66v-.05a3.75 3.75 0 1 1 3.75 3.75h-.09l-3.6 2.57c0 .05.01.1.01.15a3 3 0 1 1-5.95-.6L2.4 13.4C3.1 18.24 7.1 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zM8.4 17.8l-1.3-.54a2.25 2.25 0 0 0 4.16-1.7l-1.3-.53a1.13 1.13 0 1 1-1.56 2.77zm7.55-8.55a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5zm0-1a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z" />
    </svg>
  );
}

function GogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 4h7v5H8v11H4V4zm9 0h7v16h-4V9h-3V4z" />
    </svg>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<RedactedSettings | null>(null);
  const [psnNpsso, setPsnNpsso] = useState("");
  const [gogCode, setGogCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [connectingGog, setConnectingGog] = useState(false);

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

  async function connectGog(e: React.FormEvent) {
    e.preventDefault();
    setConnectingGog(true);
    setStatus(null);
    try {
      const res = await fetch("/api/gog/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: gogCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGogCode("");
      setStatus("Compte GOG connecté.");
      load();
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : "La connexion GOG a échoué."
      );
    } finally {
      setConnectingGog(false);
    }
  }

  async function disconnect(field: "steam" | "psn" | "gog") {
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
              Ton profil Steam doit être public : Modifier le profil →
              Confidentialité → mets <strong>Mon profil</strong> ET{" "}
              <strong>Détails du jeu</strong> sur Public. « Détails du jeu »
              seul suffit pour la bibliothèque/temps de jeu, mais les succès
              exigent que le profil entier soit public.
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
          <h2 className="font-semibold text-shelf-text">GOG</h2>
          {settings?.hasGog && (
            <span className="text-xs text-sage">Connecté</span>
          )}
        </div>

        {settings?.hasGog ? (
          <button
            type="button"
            onClick={() => disconnect("gog")}
            className="text-xs text-rust hover:text-rust/80 underline"
          >
            Déconnecter GOG
          </button>
        ) : (
          <>
            <p className="text-xs text-shelf-muted">
              GOG ne redirige pas automatiquement vers Shelfie : 1. ouvre la
              connexion GOG dans un nouvel onglet et connecte-toi. 2. Sur la
              page blanche qui s&apos;affiche ensuite, copie la valeur après{" "}
              <code className="bg-shelf-surface px-1 rounded">code=</code>{" "}
              dans l&apos;adresse. 3. Colle-la ci-dessous.
              <br />
              (GOG n&apos;a pas de temps de jeu ni de trophées via son API —
              seuls le titre et la jaquette seront disponibles.)
            </p>
            <a
              href="/api/gog/login"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#2e1a3d] text-[#c98fee] border border-[#4a2c63] text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#3b2350] transition-colors"
            >
              <GogIcon />
              Ouvrir la connexion GOG
            </a>
            <form onSubmit={connectGog} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Code copié depuis l'URL"
                value={gogCode}
                onChange={(e) => setGogCode(e.target.value)}
                className="flex-1 bg-shelf-surface border border-shelf-border rounded-lg px-3 py-2 text-sm text-shelf-text outline-none focus:border-brass/50"
              />
              <button
                type="submit"
                disabled={connectingGog || !gogCode}
                className="bg-brass text-brass-ink text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brass-hover transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {connectingGog ? "…" : "Valider"}
              </button>
            </form>
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
        {settings?.hasPsn &&
          settings.psnNpssoSavedAt &&
          daysSince(settings.psnNpssoSavedAt) >= PSN_TOKEN_WARN_AFTER_DAYS && (
            <div className="bg-rust/10 border border-rust/30 text-rust rounded-lg px-3 py-2 text-xs">
              Ton jeton NPSSO a été enregistré il y a{" "}
              {daysSince(settings.psnNpssoSavedAt)} jours — il expire
              généralement vers 2 mois. S&apos;il a expiré, ta bibliothèque
              PlayStation s&apos;arrêtera de se mettre à jour ; récupère-en
              un nouveau ci-dessous et remplace-le.
            </div>
          )}
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
