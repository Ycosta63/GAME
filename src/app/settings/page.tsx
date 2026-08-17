"use client";

import { useEffect, useState } from "react";

interface RedactedSettings {
  steamApiKey: string;
  steamId: string;
  psnNpsso: string;
  hasSteam: boolean;
  hasPsn: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<RedactedSettings | null>(null);
  const [steamApiKey, setSteamApiKey] = useState("");
  const [steamId, setSteamId] = useState("");
  const [psnNpsso, setPsnNpsso] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/settings")
      .then((res) => res.json())
      .then(setSettings);
  }

  useEffect(load, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamApiKey, steamId, psnNpsso }),
      });
      if (!res.ok) throw new Error();
      setSteamApiKey("");
      setSteamId("");
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
        <h1 className="text-2xl font-semibold">Réglages</h1>
        <p className="text-white/50 text-sm mt-1">
          Connecte tes comptes pour récupérer ta bibliothèque. Les clés sont
          stockées uniquement sur ce serveur.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6">
        <section className="bg-[#14161b] border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Steam</h2>
            {settings?.hasSteam && (
              <span className="text-xs text-emerald-400">Connecté</span>
            )}
          </div>
          <p className="text-xs text-white/50">
            1. Crée une clé API sur{" "}
            <span className="underline">steamcommunity.com/dev/apikey</span>.
            <br />
            2. Ton profil Steam doit être public (Confidentialité → Détails
            du jeu → Public) pour que l&apos;API renvoie ta bibliothèque.
            <br />
            3. Renseigne ton SteamID64 ou ton nom de profil personnalisé
            (vanity URL).
          </p>
          <input
            type="text"
            placeholder={
              settings?.steamApiKey ? "Clé API (déjà enregistrée)" : "Clé API Steam"
            }
            value={steamApiKey}
            onChange={(e) => setSteamApiKey(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
          />
          <input
            type="text"
            placeholder={
              settings?.steamId
                ? `SteamID (${settings.steamId})`
                : "SteamID64 ou nom de profil"
            }
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
          />
          {settings?.hasSteam && (
            <button
              type="button"
              onClick={() => disconnect("steam")}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Déconnecter Steam
            </button>
          )}
        </section>

        <section className="bg-[#14161b] border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">PlayStation</h2>
            {settings?.hasPsn && (
              <span className="text-xs text-emerald-400">Connecté</span>
            )}
          </div>
          <p className="text-xs text-white/50">
            1. Connecte-toi sur{" "}
            <span className="underline">my.playstation.com</span>.<br />
            2. Va sur{" "}
            <span className="underline">
              ca.account.sony.com/api/v1/ssocookie
            </span>{" "}
            (toujours connecté) et copie la valeur du champ{" "}
            <code className="bg-black/30 px-1 rounded">npsso</code>.<br />
            3. Colle-la ci-dessous (ce jeton expire après environ 2 mois).
          </p>
          <input
            type="password"
            placeholder={
              settings?.psnNpsso ? "Jeton NPSSO (déjà enregistré)" : "Jeton NPSSO"
            }
            value={psnNpsso}
            onChange={(e) => setPsnNpsso(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
          />
          {settings?.hasPsn && (
            <button
              type="button"
              onClick={() => disconnect("psn")}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Déconnecter PlayStation
            </button>
          )}
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {status && <span className="text-sm text-white/60">{status}</span>}
        </div>
      </form>
    </div>
  );
}
